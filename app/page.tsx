"use client";
import React, { useEffect, useState } from "react";

interface User {
  _id: { $oid: string };
  skills: { _id: { $oid: string }; value: string }[];
  skillsCount: number;
}

interface RelatedSkill {
  skill: string;
  score: number;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [relatedSkills, setRelatedSkills] = useState<RelatedSkill[]>([]);
  const [relatedSkillsLoading, setRelatedSkillsLoading] = useState<boolean>(false);
  const [skillMatchingDataset, setSkillMatchingDataset] = useState<{ [key: string]: RelatedSkill[] }>({});

  // Function to normalize skill strings
  const normalizeSkill = (skill: string): string => {
    return skill
      .replace(/^[\s.,;'"@=+-]+/, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  // Create skill matching dataset
  const createSkillMatchingDataset = (users: User[]) => {
    // Extract all unique skills
    const allSkills = Array.from(
      new Set(
        users.flatMap((user) => 
          user.skills.map((skill) => skill.value)
        )
      )
    );

    const relatedSkills: { [key: string]: RelatedSkill[] } = {};

    // For each skill
    allSkills.forEach((targetSkill) => {
      const normalizedTargetSkill = normalizeSkill(targetSkill);
      relatedSkills[normalizedTargetSkill] = [];
      
      // Find users who have this skill
      const usersWithSkill = users.filter((user) =>
        user.skills.some((skill) => normalizeSkill(skill.value) === normalizedTargetSkill)
      );

      // Create a frequency map for other skills that appear with the target skill
      const coOccurrenceMap: { [key: string]: number } = {};
      
      usersWithSkill.forEach((user) => {
        user.skills.forEach((skill) => {
          const normalizedSkill = normalizeSkill(skill.value);
          if (normalizedSkill !== normalizedTargetSkill) {
            coOccurrenceMap[normalizedSkill] = (coOccurrenceMap[normalizedSkill] || 0) + 1;
          }
        });
      });

      // Convert to related skills array with scores
      Object.entries(coOccurrenceMap).forEach(([skill, count]) => {
        const score = count / usersWithSkill.length; // Normalize by number of users with target skill
        relatedSkills[normalizedTargetSkill].push({
          skill: allSkills.find(s => normalizeSkill(s) === skill) || skill,
          score
        });
      });

      // Sort by score
      relatedSkills[normalizedTargetSkill].sort((a, b) => b.score - a.score);
    });

    return relatedSkills;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: User[] = await response.json();
        setUsers(data);
        
        // Create skill matching dataset once we have the users
        const dataset = createSkillMatchingDataset(data);
        setSkillMatchingDataset(dataset);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSkillChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const skill = event.target.value;
    setSelectedSkill(skill);
    setRelatedSkillsLoading(true);

    // Get related skills
    const normalizedSkill = normalizeSkill(skill);
    const related = skillMatchingDataset[normalizedSkill] || [];
    
    // Take top 5 related skills
    setRelatedSkills(related.slice(0, 5));
    setRelatedSkillsLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  // Get all unique skills for the dropdown
  const uniqueSkills = Array.from(
    new Set(users.flatMap((user) => user.skills.map((skill) => skill.value)))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Skill Matching Dataset</h1>
      <div className="mb-4">
        <label htmlFor="skills" className="block mb-2">Select a Skill:</label>
        <select 
          id="skills" 
          value={selectedSkill} 
          onChange={handleSkillChange}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select a Skill --</option>
          {uniqueSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      {relatedSkillsLoading ? (
        <div className="spinner">Loading related skills...</div>
      ) : (
        relatedSkills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 Related Skills:</h2>
            <ul className="list-disc pl-5">
              {relatedSkills.map((relSkill) => (
                <li key={relSkill.skill} className="mb-1">
                  {relSkill.skill} (Score: {relSkill.score.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
