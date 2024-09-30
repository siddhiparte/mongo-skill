"use client";
import React, { useEffect, useState } from "react";

// Define the User interface based on the new JSON structure
interface User {
  _id: { $oid: string };
  skills: { _id: { $oid: string }; value: string }[];
  skillsCount: number;
}

// Define the structure for related skills
interface RelatedSkill {
  skill: string;
  score: number;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [relatedSkills, setRelatedSkills] = useState<RelatedSkill[]>([]);
  const [relatedSkillsLoading, setRelatedSkillsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to normalize skill strings, handling special characters at the start
  const normalizeSkill = (skill: string): string => {
    return skill
      .replace(/^[\s.,;'"@=+-]+/, "") // Remove leading special characters
      .toLowerCase()
      .replace(/\s+/g, ""); // Remove extra spaces and normalize
  };

  // Function to create a skill vector for the user with weights
  const createSkillVector = (
    userSkills: string[],
    allSkills: string[]
  ): number[] => {
    const normalizedSkills = userSkills.map(normalizeSkill);
    return allSkills.map((skill) => {
      const skillNormalized = normalizeSkill(skill);
      return normalizedSkills.includes(skillNormalized) ? 1 : 0;
    });
  };

  // Create a skill matching dataset
  const createSkillMatchingDataset = (users: User[]) => {
    const allSkills = Array.from(
      new Set(users.flatMap((user) => user.skills.map((skill) => normalizeSkill(skill.value))))
    );

    const relatedSkills: { [key: string]: RelatedSkill[] } = {};

    users.forEach((user) => {
      const userSkills = user.skills.map((skill) => skill.value);
      const userVector = createSkillVector(userSkills, allSkills);

      users.forEach((otherUser) => {
        if (user._id.$oid !== otherUser._id.$oid) {
          const otherUserSkills = otherUser.skills.map((skill) => skill.value);
          const otherUserVector = createSkillVector(otherUserSkills, allSkills);
          const dotProduct = userVector.reduce(
            (sum, val, i) => sum + val * otherUserVector[i],
            0
          );
          const magnitudeA = Math.sqrt(
            userVector.reduce((sum, val) => sum + val * val, 0)
          );
          const magnitudeB = Math.sqrt(
            otherUserVector.reduce((sum, val) => sum + val * val, 0)
          );
          const similarity =
            magnitudeA && magnitudeB
              ? dotProduct / (magnitudeA * magnitudeB)
              : 0;

          if (similarity > 0) {
            userSkills.forEach((skill) => {
              const normalizedSkill = normalizeSkill(skill);
              if (!relatedSkills[normalizedSkill]) {
                relatedSkills[normalizedSkill] = [];
              }

              otherUserSkills.forEach((otherSkill) => {
                const normalizedOtherSkill = normalizeSkill(otherSkill);
                if (normalizedOtherSkill !== normalizedSkill) {
                  const existingRelated = relatedSkills[normalizedSkill].find(
                    (rel) => rel.skill === normalizedOtherSkill
                  );

                  if (existingRelated) {
                    existingRelated.score += similarity;
                  } else {
                    relatedSkills[normalizedSkill].push({
                      skill: normalizedOtherSkill,
                      score: similarity,
                    });
                  }
                }
              });
            });
          }
        }
      });
    });

    // Normalize scores to be between 0 and 1
    const maxScore = Math.max(
      ...Object.values(relatedSkills).flatMap((skill) =>
        skill.map((rel) => rel.score)
      )
    );

    if (maxScore > 0) {
      Object.values(relatedSkills).forEach((skill) => {
        skill.forEach((rel) => {
          rel.score /= maxScore;
        });
      });
    }

    return relatedSkills;
  };

  // Create skill matching dataset after users are loaded
  const skillMatchingDataset =
    users.length > 0 ? createSkillMatchingDataset(users) : {};

  // Handle skill selection
  const handleSkillChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const skill = event.target.value;
    setSelectedSkill(skill);
    setRelatedSkillsLoading(true); // Start loading spinner

    // Simulate the delay of fetching related skills
    setTimeout(() => {
      // Get the related skills, filter out those with score 0, sort by score, and select the top 5
      const related = skillMatchingDataset[normalizeSkill(skill)] || [];
      const filteredRelated = related.filter((skill) => skill.score > 0); // Exclude skills with score 0.0
      const top5RelatedSkills = filteredRelated
        .sort((a, b) => b.score - a.score) // Sort in descending order of score
        .slice(0, 5); // Take the top 5 skills
      setRelatedSkills(top5RelatedSkills);
      setRelatedSkillsLoading(false); // Stop loading spinner
    }, 500); // Adjust the timeout as needed
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Get all unique skills for the dropdown and sort them alphabetically
  const uniqueSkills = new Map<string, string>();
  users.forEach((user) => {
    user.skills.forEach((skill) => {
      const normalizedSkill = normalizeSkill(skill.value);
      if (!uniqueSkills.has(normalizedSkill)) {
        uniqueSkills.set(normalizedSkill, skill.value);
      }
    });
  });

  const sortedSkills = Array.from(uniqueSkills.values()).sort((a, b) =>
    normalizeSkill(a).localeCompare(normalizeSkill(b))
  );

  return (
    <div>
      <h1>Skill Matching Dataset</h1>
      <label htmlFor="skills">Select a Skill:</label>
      <select id="skills" value={selectedSkill} onChange={handleSkillChange}>
        <option value="">-- Select a Skill --</option>
        {sortedSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {relatedSkillsLoading ? (
        <div className="spinner">Loading related skills...</div>
      ) : relatedSkills.length > 0 ? (
        <div>
          <h2>Top 5 Related Skills:</h2>
          <ul>
            {relatedSkills.map((relSkill) => (
              <li key={relSkill.skill}>
                {relSkill.skill} (Score: {relSkill.score.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      ) : selectedSkill ? (
        <div>No related skills found.</div>
      ) : null}
    </div>
  );
}
