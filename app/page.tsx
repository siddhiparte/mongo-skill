"use client";
import React, { useEffect, useState } from "react";

// Define the User interface
interface User {
  id: number;
  skills: string[];
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: User[] = await response.json();
        setUsers(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to normalize skill strings
  const normalizeSkill = (skill: string): string => {
    return skill.toLowerCase().replace(/\s+/g, "");
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
      new Set(users.flatMap((user) => user.skills.map(normalizeSkill)))
    );

    const relatedSkills: { [key: string]: RelatedSkill[] } = {};

    users.forEach((user) => {
      const userVector = createSkillVector(user.skills, allSkills);

      users.forEach((otherUser) => {
        if (user.id !== otherUser.id) {
          const otherUserVector = createSkillVector(
            otherUser.skills,
            allSkills
          );
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
            user.skills.forEach((skill) => {
              const normalizedSkill = normalizeSkill(skill);
              if (!relatedSkills[normalizedSkill]) {
                relatedSkills[normalizedSkill] = [];
              }

              otherUser.skills.forEach((otherSkill) => {
                const normalizedOtherSkill = normalizeSkill(otherSkill);
                if (normalizedOtherSkill !== normalizedSkill) {
                  const existingRelated = relatedSkills[normalizedSkill].find(
                    (rel) => rel.skill === normalizedOtherSkill
                  );

                  if (existingRelated) {
                    existingRelated.score += similarity; // Accumulate score
                  } else {
                    relatedSkills[normalizedSkill].push({
                      skill: normalizedOtherSkill,
                      score: similarity, // Initial score
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
          rel.score /= maxScore; // Normalize the score
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
    setRelatedSkills(skillMatchingDataset[normalizeSkill(skill)] || []);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Get all unique skills for the dropdown
  const allSkills = Array.from(new Set(Object.keys(skillMatchingDataset)));

  return (
    <div>
      <h1>Skill Matching Dataset</h1>
      <label htmlFor="skills">Select a Skill:</label>
      <select id="skills" value={selectedSkill} onChange={handleSkillChange}>
        <option value="">-- Select a Skill --</option>
        {allSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {relatedSkills.length > 0 && (
        <div>
          <h2>Related Skills:</h2>
          <ul>
            {relatedSkills.map((relSkill) => (
              <li key={relSkill.skill}>
                {relSkill.skill} (Score: {relSkill.score.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
