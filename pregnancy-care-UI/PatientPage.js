import React, {useState, useEffect} from "react";
import { useParams } from 'react-router-dom';
import "./PatientPage.css";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {Card, Container, Row, Col, CardBody} from 'react-bootstrap';
import calendar_icon from '../assets/calendar_icon.png';
import information_icon from '../assets/information_icon.png';
import observation_icon from '../assets/observation_icon.png';
import medicine_icon from '../assets/medicine_icon.png';

const PatientPage = () => {
  const { patientId } = useParams();
  // for patient info data save
  const [patientInfo, setPatientInfo] = useState({
    id: '',
    name: '',
    age: '',
    birthDate: '',
    address: '',
    contact: {email:'', phone:''},
    allergies: '',
    alcoholIntake: '',
    smokingStatus: '',
  });

  // Observations state
  const [observations, setObservations] = useState([]);
  const [bloodPressureData, setBloodPressureData] = useState([]); // State for blood pressure data
  const [vitalSigns, setVitalSigns] = useState([]); // State for vital signs data
  const [dueDate, setDueDate] = useState(''); // State for due date
  const [Medications, setMedication] = useState([]); // State for medication statement data

  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        const response = await fetch("https://hapi.fhir.org/baseR4/Patient/1202/$everything");
        const data = await response.json();
  
        if (data.entry) {
          const patientResource = data.entry.find(entry => entry.resource.resourceType === 'Patient');
          if (patientResource) {
            const patient = patientResource.resource;
            const id = patient.id;
            const familyName = patient.name[0].family;
            const givenName = patient.name[0].given.join(' ');
            const name = `${givenName} ${familyName}`;
            const birthDate = patient.birthDate;
            const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
            const address = patient.address[0] ? patient.address[0].city : 'City not available';
  
            let email = '';
            let phone = '';
            if (patient.telecom) {
              patient.telecom.forEach(contact => {
                if (contact.system === 'email') email = contact.value;
                if (contact.system === 'phone') phone = contact.value;
              });
            }
  
            setPatientInfo(prevState => ({
              ...prevState,
              id,
              name,
              age,
              birthDate,
              address,
              contact: { email, phone }
            }));
          } else {
            console.error('No patient information found.');
          }
  
          const observationResources = data.entry.filter(entry => entry.resource.resourceType === 'Observation');
          const observationDate = observationResources.map(obs => ({
            display: obs.resource.code.coding[0]?.display || 'No display info',
            text: obs.resource.code.text || 'No text info',
          }));
  
          setObservations(observationDate);
        } else {
          console.error('No observation information found.');
        }
      } catch (error) {
        console.error('Error fetching patient info:', error);
      }
    };
  
    const fetchAllergies = async () => {
      try {
        const response = await fetch('https://hapi.fhir.org/baseR4/AllergyIntolerance?patient=53373');
        const data = await response.json();
        const allergies = data.entry
          ? data.entry.map(entry => {
              const allergyType = entry.resource.type || 'No type';
              const substance = entry.resource.reaction?.[0]?.substance?.coding?.[0]?.display || 'Unknown substance';
              const manifestation = entry.resource.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display || 'Unknown manifestation';
              return { allergyType, substance, manifestation };
            })
          : [];
  
        setPatientInfo(prevState => ({ ...prevState, allergies }));
      } catch (error) {
        console.error('Error fetching allergies:', error);
      }
    };
  
    const fetchAlcoholIntake = async () => {
      try {
        const response = await fetch('https://hapi.fhir.org/baseR4/Observation?patient=2080537&code=74013-4');
        const data = await response.json();
        const alcoholIntake = data.entry
          ? `${data.entry[0].resource.valueQuantity?.value || 'No data'} drinks per day`
          : 'No alcohol intake data';
  
        setPatientInfo(prevState => ({ ...prevState, alcoholIntake }));
      } catch (error) {
        console.error('Error fetching alcohol intake:', error);
      }
    };
  
    const fetchSmokingStatus = async () => {
      try {
        const response = await fetch('https://hapi.fhir.org/baseR4/Observation?patient=1738431&code=72166-2');
        const data = await response.json();
        const smokingStatus = data.entry
          ? data.entry[0].resource.valueCodeableConcept?.coding[0]?.display || 'No smoking status data'
          : 'No smoking status data';
  
        setPatientInfo(prevState => ({ ...prevState, smokingStatus }));
      } catch (error) {
        console.error('Error fetching smoking status:', error);
      }
    };
  
    const fetchData = async () => {
      try {
        await Promise.all([fetchPatientInfo(), fetchAllergies(), fetchAlcoholIntake(), fetchSmokingStatus()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, []);

  

  // Fetch blood pressure data
  useEffect(() => {
    const fetchBloodPressure = async () => {
      try {
        const response = await fetch("https://hapi.fhir.org/baseR4/Observation?patient=1200");
        const data = await response.json();

        if (data.entry) {
          // Extract blood pressure data (Code: 85354-9 for blood pressure panel)
        const bloodPressureObservations = data.entry.filter(entry =>
          entry.resource.code.coding.some(coding => coding.code === '85354-9')
        );
        
        const bpData = bloodPressureObservations.map(obs => {
          const systolic = obs.resource.component.find(comp => comp.code.coding[0]?.code === '8480-6')?.valueQuantity.value; // Systolic
          const diastolic = obs.resource.component.find(comp => comp.code.coding[0]?.code === '8462-4')?.valueQuantity.value; // Diastolic
          const effectiveDate = obs.resource.effectiveDateTime; // Date of observation

          return { date: effectiveDate, systolic, diastolic };
        }).filter(bp => bp.systolic && bp.diastolic); // Filter out any incomplete records

        setBloodPressureData(bpData);
    }
  }
  catch (error) {
    console.error('Error fetching blood pressure data:', error);
  }
}
fetchBloodPressure();
}, []);

// Fetch vital signs data
useEffect(() => {
  const fetchVitalSigns = async () => {
    try {
      const response = await fetch("https://hapi.fhir.org/baseR4/Observation?code=85353-1&patient=1202");
      const data = await response.json();

      if (data.entry) {
        const vitalSignsData = data.entry.flatMap(entry => {
          const resource = entry.resource;
          const date = resource.meta.lastUpdated;

          // Handle both single valueQuantity and multiple components
          if (resource.valueQuantity) {
            if(resource.code.coding.length == 2){
              const value = resource.valueQuantity.value;
              const unit = resource.valueQuantity.unit;
              const code = resource.code.coding[1]?.code;
              const display = resource.code.coding[1]?.display;
  
              let label = getLabelFromCode(code, display);
              return [{ value, unit, date, label }];
            }
          } else if (resource.component) {
            return resource.component.map(comp => {
              const value = comp.valueQuantity.value;
              const unit = comp.valueQuantity.unit;
              const code = comp.code.coding[0]?.code;
              const display = comp.code.coding[0]?.display;

              let label = getLabelFromCode(code, display);

              return { value, unit, date, label };

            });
          }
          return [];
        }).filter(vital => vital.value != null); // Filter out any incomplete records

        setVitalSigns(vitalSignsData);
      }
    } catch (error) {
      console.error('Error fetching vital signs data:', error);
    }
  };

  fetchVitalSigns();
}, []);

const getLabelFromCode = (code, display) => {
  switch (code) {
    case '29463-7': return 'Weight';
    case '8302-2': return 'Height';
    case '8287-5': return 'Head Circumference';
    case '2708-6': return 'Oxygen Saturation';
    case '8310-5': return 'Body Temperature';
    case '8867-4': return 'Heart Rate';
    case '39156-5': return 'BMI';
    default: return display || 'Unknown Vital Sign';
  }
};

const prepareChartData = () => {
  const chartData = {};
  vitalSigns.forEach(({ date, value, label }) => {
    const formattedDate = new Date(date).toLocaleDateString();
    if (!chartData[formattedDate]) {
      chartData[formattedDate] = { date: formattedDate };
    }
    chartData[formattedDate][label] = value;
  });
  return Object.values(chartData);
};


const formattedChartData = prepareChartData();

// Fetch medication statement data
useEffect(() => {
  const fetchMedicationStatement = async () => {
    try {
      const response = await fetch("https://hapi.fhir.org/baseR4/MedicationStatement?patient=1202");
      const data = await response.json();

      if (data.entry) {
        const medicationStatements = data.entry.map((item) => {
          const resource = item.resource;
          const medication = resource.contained[0];
          
          // Extract medication statement data
          return {
            id: resource.id,
            status: resource.status,
            medicationName: medication.code.coding[0].display,
            ndcCode: medication.code.coding[0].code,
            form: medication.form?.coding[0]?.display,
            batchInfo: medication.batch?.[0]?.lotNumber,
            expirationDate: medication.batch?.expirationDate,
            ingredients: medication.ingredient.map((ing) => ({
              name: ing.itemCodeableConcept.coding[0].display,
              strength: ing.strength?.numerator?.value + ' ' + ing.strength?.numerator?.unit,
            })),
            dosageText: resource.dosage[0].text,
            effectiveDate: resource.effectiveDateTime,
            statusReason: resource.reasonCode?.[0]?.text,
            route: resource.dosage[0].route?.coding[0]?.display,
          }
        });

        setMedication(medicationStatements);
      }
    } catch (error) {
      console.error('Error fetching medication statement data:', error);
    }   
  };

    fetchMedicationStatement();
    }, []);

// Fetch due date
useEffect(() => {
  const fetchDueDate = async () => {
    try {
      const response = await fetch("https://hapi.fhir.org/baseR4/Observation?code=11778-8&patient=2536426");
      const data = await response.json();

      if (data.entry) {
        const dueDateObservation = data.entry.find(entry => entry.resource.code.coding[0].code === '11778-8');

        if (dueDateObservation) {
          setDueDate(dueDateObservation.resource.valueDateTime);
        } else {
          console.error('No due date information found.');
        }
      }
    } catch (error) {
      console.error('Error fetching due date:', error);
    }
  };

  fetchDueDate();
} , []);


  return (
    <Container>
      {/* Header Section */}
      <Row className="header">
        <Col md={8}>
          <h1>🤰Mom Current Status</h1>
        </Col>
        <Col md={4} className="due-date">
            <img src={calendar_icon} alt="Due Date Icon" style={{width: '25px', height:'25px'}}/>
            <h5>Due Date: {dueDate}</h5>
        </Col>
      </Row>
      
      {/* Patient Info */}
      <Row>
        <Col>
          <Card className="patient_info">
            <Card.Body>
              <Card.Title>
                <img src={information_icon} style={{marginRight: '10px', width: '30px', height:'30px'}}></img>
                Patient Information
              </Card.Title>
              <ul>
                <li>
                  <strong>ID: </strong>{patientInfo.id} <br />
                  <strong>Name: </strong>{patientInfo.name} <br />
                  <strong>Age: </strong>{patientInfo.age} <br />
                  <strong>Date of Birth: </strong>{patientInfo.birthDate} <br />
                  <strong>Address: </strong>{patientInfo.address} <br />
                  <strong>Email: </strong>{patientInfo.contact.email} <br />
                  <strong>Phone: </strong>{patientInfo.contact.phone} <br />
                </li>
                <li>
                  <strong>Allergies: </strong>
                  <ul>
                    {patientInfo.allergies.length > 0 ? (
                      patientInfo.allergies.map((allergy, index) => (
                        <li key={index}>
                          {allergy.allergyType}: {allergy.substance} (Reaction: {allergy.manifestation})
                        </li>
                      ))
                    ) : (
                      <li>No allergies reported</li>
                    )}
                  </ul>
                </li>
                <li>
                  <strong>Alcohol Intake: </strong>{patientInfo.alcoholIntake} <br />
                  <strong>Smoking Status: </strong>{patientInfo.smokingStatus} <br />
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Observation */}
      <Row>
        <Col md={6}>
          <Card className="observation">
            <Card.Body>
              <Card.Title>
                <img src={observation_icon} style={{marginRight: '10px', width: '30px', height:'30px'}}></img>
                Observation
              </Card.Title>
              {observations.length > 0 ? ( // for multiple observation data}
              <div className="obser">
                <ul>
                {observations.map((obs, index) => (
                  <li key={index} className="text">
                    <strong>Abnormality: </strong>{obs.display} <br />
                    <strong>High risk: </strong>{obs.text}
                  </li>
                ))}
                </ul>
              </div>
              ):(<p>Here is the patient observation.</p>)}
            </Card.Body>
          </Card>
      </Col>

      {/* Medication state */}
      <Col md={6}>
        <Card className="medication_state">
          <Card.Title>
            <img src={medicine_icon} style={{marginRight: '10px', width: '30px', height:'30px'}}></img>
            Medication Statement
          </Card.Title>
          <Card.Body>
            <ul>
            {Medications.map((medication, index) => (
              <li key={index} className="medication_item">
                  <strong>Medication ID: </strong> {medication.id} <br />
                  <strong>Medication Name: </strong> {medication.medicationName} <br />
                  <strong>Status: </strong> {medication.status} <br />
                  <strong>Form: </strong> {medication.form} <br />
                  <strong>Batch Info: </strong> {medication.batchInfo} <br />
                  <strong>Expiration Date: </strong> {medication.expirationDate} <br />
                  <strong>Dosage Text: </strong> {medication.dosageText} <br />
                  <strong>Effective Date: </strong> {medication.effectiveDate} <br />
                  <strong>Status Reason: </strong> {medication.statusReason} <br />
                  <strong>Route: </strong> {medication.route} <br />
                  <div className="ingredients">
                    <p><strong>Ingredients:</strong></p>
                    {medication.ingredients.map((ing, ingIndex) => (
                      <div key={ingIndex}>
                        <p>Name: {ing.name}</p>
                        <p>Strength: {ing.strength}</p>
                      </div>
                      ))}
                  </div>
              </li>
            ))}
            </ul>
          </Card.Body>
        </Card>
      </Col>
      </Row>
              
        {/* Blood Pressure Chart */}
        {/* <div className="blood_pressure">
          <h3>Blood Pressure Readings</h3>
          {bloodPressureData.length > 0 ? (
            <LineChart
              width={600}
              height={300}
              data={bloodPressureData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#8884d8" name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="#82ca9d" name="Diastolic" />
            </LineChart>
          ) : (
            <p>No blood pressure data available.</p>
          )}
        </div> */}

        {/* Vital Signs Chart */}
        <div className="vital_signs">
        <h3>Vital Signs</h3>

        {formattedChartData.length > 0 ? (
          <BarChart
            width={600}
            height={300}
            data={formattedChartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="date" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            {Array.from(new Set(vitalSigns.map(v => v.label))).filter(key => key !== 'date').map((label, index) => (
            <Bar
              key={index}
              dataKey={label}
              fill={`hsl(${(index * 360 / vitalSigns.length) % 360}, 70%, 50%)`}
              name={label}
            />
          ))}
          </BarChart>
        ) : (
          <p>No vital signs data available.</p>
        )}
      </div>
    </Container>
  );
}

export default PatientPage;