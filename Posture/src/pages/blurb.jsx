import { useState } from "react";
import Dropdown from "../components/Dropdown";
import InstrumentBlurb from "../components/instrumentblurb";


function HomePage() {
 const [instrument, setInstrument] = useState("");
  return (
   <div style={{ padding: "2rem" }}>
     <h1>Instrument Posture Guide</h1>
     <Dropdown onSelect={setInstrument} />
     <InstrumentBlurb instrument={instrument} />
   </div>
 );
}


export default HomePage;