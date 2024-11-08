// "use client";
// import React, { useEffect, useState } from "react";

// interface User {
//   _id: { $oid: string };
//   skills: { _id: { $oid: string }; value: string }[];
//   skillsCount: number;
// }

// interface RelatedSkill {
//   skill: string;
//   score: number;
// }

// export default function Home() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [selectedSkill, setSelectedSkill] = useState<string>("");
//   const [relatedSkills, setRelatedSkills] = useState<RelatedSkill[]>([]);
//   const [relatedSkillsLoading, setRelatedSkillsLoading] = useState<boolean>(false);
//   const [skillMatchingDataset, setSkillMatchingDataset] = useState<{ [key: string]: RelatedSkill[] }>({});

//   // Function to normalize skill strings
//   const normalizeSkill = (skill: string): string => {
//     return skill
//       .replace(/^[\s.,;'"@=+-]+/, "")
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, " ");
//   };

//   // Create skill matching dataset
//   const createSkillMatchingDataset = (users: User[]) => {
//     // Extract all unique skills
//     const allSkills = Array.from(
//       new Set(
//         users.flatMap((user) => 
//           user.skills.map((skill) => skill.value)
//         )
//       )
//     );

//     const relatedSkills: { [key: string]: RelatedSkill[] } = {};

//     // For each skill
//     allSkills.forEach((targetSkill) => {
//       const normalizedTargetSkill = normalizeSkill(targetSkill);
//       relatedSkills[normalizedTargetSkill] = [];
      
//       // Find users who have this skill
//       const usersWithSkill = users.filter((user) =>
//         user.skills.some((skill) => normalizeSkill(skill.value) === normalizedTargetSkill)
//       );

//       // Create a frequency map for other skills that appear with the target skill
//       const coOccurrenceMap: { [key: string]: number } = {};
      
//       usersWithSkill.forEach((user) => {
//         user.skills.forEach((skill) => {
//           const normalizedSkill = normalizeSkill(skill.value);
//           if (normalizedSkill !== normalizedTargetSkill) {
//             coOccurrenceMap[normalizedSkill] = (coOccurrenceMap[normalizedSkill] || 0) + 1;
//           }
//         });
//       });

//       // Convert to related skills array with scores
//       Object.entries(coOccurrenceMap).forEach(([skill, count]) => {
//         const score = count / usersWithSkill.length; // Normalize by number of users with target skill
//         relatedSkills[normalizedTargetSkill].push({
//           skill: allSkills.find(s => normalizeSkill(s) === skill) || skill,
//           score
//         });
//       });

//       // Sort by score
//       relatedSkills[normalizedTargetSkill].sort((a, b) => b.score - a.score);
//     });

//     return relatedSkills;
//   };

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await fetch("/api/users");
//         if (!response.ok) {
//           throw new Error("Network response was not ok");
//         }
//         const data: User[] = await response.json();
//         setUsers(data);
        
//         // Create skill matching dataset once we have the users
//         const dataset = createSkillMatchingDataset(data);
//         setSkillMatchingDataset(dataset);
//       } catch (error) {
//         console.error("Error fetching users:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const handleSkillChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     const skill = event.target.value;
//     setSelectedSkill(skill);
//     setRelatedSkillsLoading(true);

//     // Get related skills
//     const normalizedSkill = normalizeSkill(skill);
//     const related = skillMatchingDataset[normalizedSkill] || [];
    
//     // Take top 5 related skills
//     setRelatedSkills(related.slice(0, 5));
//     setRelatedSkillsLoading(false);
//   };

//   if (loading) return <div>Loading...</div>;

//   // Get all unique skills for the dropdown
//   const uniqueSkills = Array.from(
//     new Set(users.flatMap((user) => user.skills.map((skill) => skill.value)))
//   ).sort((a, b) => a.localeCompare(b));

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Skill Matching Dataset</h1>
//       <div className="mb-4">
//         <label htmlFor="skills" className="block mb-2">Select a Skill:</label>
//         <select 
//           id="skills" 
//           value={selectedSkill} 
//           onChange={handleSkillChange}
//           className="w-full p-2 border rounded"
//         >
//           <option value="">-- Select a Skill --</option>
//           {uniqueSkills.map((skill) => (
//             <option key={skill} value={skill}>
//               {skill}
//             </option>
//           ))}
//         </select>
//       </div>

//       {relatedSkillsLoading ? (
//         <div className="spinner">Loading related skills...</div>
//       ) : (
//         relatedSkills.length > 0 && (
//           <div>
//             <h2 className="text-xl font-semibold mb-2">Top 5 Related Skills:</h2>
//             <ul className="list-disc pl-5">
//               {relatedSkills.map((relSkill) => (
//                 <li key={relSkill.skill} className="mb-1">
//                   {relSkill.skill} (Score: {relSkill.score.toFixed(2)})
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )
//       )}
//     </div>
//   );
// }
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
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [relatedSkills, setRelatedSkills] = useState<RelatedSkill[]>([]);
  const [relatedSkillsLoading, setRelatedSkillsLoading] = useState(false);
  const [skillMatchingDataset, setSkillMatchingDataset] = useState<{ [key: string]: RelatedSkill[] }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const normalizeSkill = (skill: string): string => {
    return skill
      .replace(/^[\s.,;'"@=+-]+/, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  const createSkillMatchingDataset = (users: User[]) => {
    const allSkills = Array.from(
      new Set(users.flatMap((user) => user.skills.map((skill) => skill.value)))
    );

    const relatedSkills: { [key: string]: RelatedSkill[] } = {};

    allSkills.forEach((targetSkill) => {
      const normalizedTargetSkill = normalizeSkill(targetSkill);
      relatedSkills[normalizedTargetSkill] = [];

      const usersWithSkill = users.filter((user) =>
        user.skills.some((skill) => normalizeSkill(skill.value) === normalizedTargetSkill)
      );

      const coOccurrenceMap: { [key: string]: number } = {};

      usersWithSkill.forEach((user) => {
        user.skills.forEach((skill) => {
          const normalizedSkill = normalizeSkill(skill.value);
          if (normalizedSkill !== normalizedTargetSkill) {
            coOccurrenceMap[normalizedSkill] = (coOccurrenceMap[normalizedSkill] || 0) + 1;
          }
        });
      });

      Object.entries(coOccurrenceMap).forEach(([skill, count]) => {
        const score = count / usersWithSkill.length;
        relatedSkills[normalizedTargetSkill].push({
          skill: allSkills.find((s) => normalizeSkill(s) === skill) || skill,
          score,
        });
      });

      relatedSkills[normalizedTargetSkill].sort((a, b) => b.score - a.score);
    });

    return relatedSkills;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Network response was not ok");
        const data: User[] = await response.json();
        setUsers(data);
        setSkillMatchingDataset(createSkillMatchingDataset(data));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const getRecommendations = () => {
    setRelatedSkillsLoading(true);
  
    const relatedSkillMap: { [key: string]: number } = {};
  
    selectedSkills.forEach(skill => {
      const normalizedSkill = normalizeSkill(skill);
      const related = skillMatchingDataset[normalizedSkill] || [];
  
      related.forEach(relSkill => {
        const normalizedRelSkill = normalizeSkill(relSkill.skill);
        if (!selectedSkills.includes(normalizedRelSkill)) {
          if (relatedSkillMap[normalizedRelSkill]) {
            relatedSkillMap[normalizedRelSkill] += relSkill.score;
          } else {
            relatedSkillMap[normalizedRelSkill] = relSkill.score;
          }
        }
      });
    });
  
    // Convert to an array of related skills, and exclude selected skills using a for loop
    const sortedRelatedSkills: RelatedSkill[] = [];
    for (const [skill, score] of Object.entries(relatedSkillMap)) {
      let isSelected = false;
      for (let i = 0; i < selectedSkills.length; i++) {
        if (normalizeSkill(selectedSkills[i]) === skill) {
          isSelected = true;
          break;
        }
      }
      if (!isSelected) {
        sortedRelatedSkills.push({ skill, score });
      }
    }
  
    // Sort by score in descending order and limit to top 5
    sortedRelatedSkills.sort((a, b) => b.score - a.score);
    setRelatedSkills(sortedRelatedSkills.slice(0, 5));
    setRelatedSkillsLoading(false);
  };
  
  const clearSelectedSkills = () => {
    setSelectedSkills([]);
  };

  if (loading) return <div>Loading...</div>;

  const uniqueSkills = Array.from(
    new Set(users.flatMap((user) => user.skills.map((skill) => skill.value)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredSkills = uniqueSkills.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Search and Skill Selection */}
      <div className="mb-4 md:mb-8">
        <input
          type="text"
          placeholder="Search for skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Skill Selection */}
        <div className="mb-4 md:mb-0" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <h2 className="text-lg font-semibold mb-2 md:mb-4">Select Skills:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {filteredSkills.map((skill) => (
              <div key={skill} className="flex items-center">
                <input
                  type="checkbox"
                  id={skill}
                  checked={selectedSkills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  className="mr-2"
                />
                <label htmlFor={skill} className="cursor-pointer truncate">
                  {skill}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          {relatedSkillsLoading ? (
            <div className="mt-4">Loading related skills...</div>
          ) : (
            relatedSkills.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Recommended Skills:</h2>
                <ul className="list-disc pl-5">
                  {relatedSkills.map((relSkill) => (
                    <li key={relSkill.skill}>
                      {relSkill.skill} (Score: {relSkill.score.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg flex gap-4 justify-between flex-col md:flex-row">
        <button
          onClick={clearSelectedSkills}
          className="bg-blue-500 text-white rounded px-6 py-3"
          disabled={selectedSkills.length === 0}
        >
          Clear Selected Skills
        </button>
        <button
          onClick={getRecommendations}
          className="bg-gray-300 text-gray-700 rounded px-6 py-3"
        >
          Get Recommendations
        </button>
      </div>
    </div>
  );
}
