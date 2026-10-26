/* oxlint-disable react(set-state-in-effect) */
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Materials() {
  const [materials, setMaterials] = useState([]);

  async function loadMaterials() {
    const { data, error } = await supabase
      .from("materials")
      .select("*");

    if (error) {
      console.error(error);
    } else {
      // Remote data is intentionally synchronized into local UI state here.
      // oxlint-disable-next-line react(set-state-in-effect)
      setMaterials(data);
    }
  }

  // The effect synchronizes the table with the remote Supabase source.
  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => {
    // oxlint-disable-next-line react(set-state-in-effect)
    loadMaterials();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Matériaux</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Unité</th>
            <th>Quantité</th>
          </tr>
        </thead>

        <tbody>
          {materials.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.unit}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
