import { useParams } from "react-router-dom";
import InstrumentBlurb from "../components/instrumentblurb";


function InstrumentPage() {
 const { instrument } = useParams(); 


 const displayInstrument = instrument.charAt(0).toUpperCase() + instrument.slice(1);


 return (
   <div style={{ padding: "2rem" }}>
     <h1>{displayInstrument} Posture Guide</h1>
     <InstrumentBlurb instrument={displayInstrument} />
   </div>
 );
}


export default InstrumentPage;
