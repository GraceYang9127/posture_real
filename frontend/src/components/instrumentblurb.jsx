import { useState, useEffect } from "react";


function InstrumentBlurb({ instrument }) {
 const [blurb, setBlurb] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");


 useEffect(() => {
   if (!instrument) {
     setBlurb("");
     return;
   }


   const fetchBlurb = async () => {
     setLoading(true);
     setError("");


     try {
       const response = await fetch("http://localhost:5000/get_blurb", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ instrument }),
       });


       const data = await response.json();


       if (response.ok) {
         setBlurb(data.blurb);
       } else {
         setError("Failed to fetch blurb.");
         console.error(data.details);
       }
     } catch (err) {
       setError("An error occurred.");
       console.error(err);
     }


     setLoading(false);
   };


   fetchBlurb();
 }, [instrument]);


 if (!instrument) return null;


 return (
   <div style={{ marginTop: "1rem" }}>
     {loading && <p>Loading posture guide for {instrument}...</p>}
     {error && <p style={{ color: "red" }}>{error}</p>}
     {blurb && <p>{blurb}</p>}
   </div>
 );
}


export default InstrumentBlurb;
