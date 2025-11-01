//same logic as advertiser
import { useState } from "react";

interface AdSpace {
  id: number;
  name: string;
  description: string;
}

export default function PublisherPage() {
  const [adSpaces, setAdSpaces] = useState<AdSpace[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const addAdSpace = () => {
    if (!name) return;
    const newAd: AdSpace = { id: Date.now(), name, description };
    setAdSpaces([...adSpaces, newAd]);
    setName("");
    setDescription("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Publisher Portal</h2>
      <p>Add ad spaces where advertisers can bid for display.</p>
      <input
        placeholder="Ad Space Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={addAdSpace}>Add Ad Space</button>

      <h3>Your Ad Spaces</h3>
      <ul>
        {adSpaces.map((ad) => (
          <li key={ad.id}>
            {ad.name} — {ad.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
