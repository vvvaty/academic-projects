import React, {useState, useEffect} from "react";
import "./DoctorHomePage.css";
// import mom_icon from "../../assets/mom_icon.png";

const HomePage = () => {

  // initial empty state for appointments
  const [appointments, setAppointments] = useState([]);

  // hook to fetch appointments data from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("https://hapi.fhir.org/baseR4/Appointment?practitioner=1058")
        const data = await response.json(); // turn data into JSON*

        console.log("fetch data", data);

            // check if the appointment has a resource (better to get wanted data)
  
         if (data.entry) { // check if there are entries in the response
           const latestAppointments = data.entry.slice(0, 4).map(appointment => { // get 4 appointments

             // check if the appointment has a resource (better to get wanted data)
             if (appointment.resource) {
               const patient = appointment.resource.participant?.[0]; // get the first participant
               console.log(appointment);
              
               const id = appointment.resource.id || "N/A"; // id is under resource
               const patientId = patient?.actor?.reference?.split('/')[1] || "N/A"; // id is under participant -> actor reference 
               const patientName = patient?.actor?.display || "N/A";
               const minutesDuration = appointment.resource.minutesDuration || 30; //default duration time
              
               // turn the start date and time into a readable format
               const startDateTime = new Date(appointment.resource.start);

               const startDate = startDateTime.toLocaleDateString([], {
                 year : 'numeric',
                 month: 'short',
                 day: '2-digit',
               });

               const startTime = startDateTime.toLocaleTimeString([], {
                 hour: '2-digit',
                 minute: '2-digit',
              });

               return { patientId, patientName, startDate, startTime, minutesDuration, id}; // return the data we want to display
              }
            })
            .filter(Boolean); // filter out any undefined values
          
          setAppointments(latestAppointments); // set the appointments to the state
        } else {
          console.error("No appointments found in the response");


        }
      } catch (error) {
          console.error("Error fetching appointments", error);
        }
      };
      fetchAppointments();
    }
    , []); // empty array to only run once

  return (
    <div className="doctor_homepage">
        <div className="home_section">
          <div className="text_news"> {/* div for text and news */}
              
              {/* slogn div */}
              <div className="home_title">
                <h1>Get Better Care For Mom</h1>
                <h3>Ensuring a safer and healthier pregnancy journey</h3>
                <p>"Get Better Care For Mom" is dedicated to providing every mother with personalised, scientifically informed pregnancy health management. 
                Start your journey with us today and experience a healthier, more confident pregnancy!</p>
                
              </div>
              {/* <img src={mom_icon} alt="mom" className="mom_icon" /> */}

              {/* news div */}
              <div className="news">
                  <h3>News</h3>
                  <ul>
                      <li>Nutrition During Pregnancy</li>
                      <li>Monitoring Fetal Movement</li>
                      <li>Prenatal Checkup Schedule</li>
                  </ul>
              </div>
          </div>
        </div>
        
        
        {/* upcoming appointments div */}
        <div>
            <h5 className="appoint_text">Upcoming Appointments...</h5>
        </div>

        <ul className="upcoming_appointments">
          {appointments.map((appointment, index) => (
            <a key={index} className="info" href={`/doctor-appointment-detail/${appointment.id}`}>
              <div className="name">
                <h6>{appointment.patientName} (ID: {appointment.patientId})</h6>
              </div>
              <div className="time">
                <p>{appointment.startDate}</p>
                <p>{appointment.startTime}</p>
                <p>Duration: {appointment.minutesDuration} minutes</p>
              </div>
            </a>
          ))}
        </ul>
      </div>
  );
}

export default HomePage;