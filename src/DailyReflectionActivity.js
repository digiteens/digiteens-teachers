// src/DailyReflectionActivity.js
import React from "react";
import { Accordion, ListGroup } from "react-bootstrap";
import WordCloudComponent from "./WordCloudComponent";

const DailyReflectionActivity = ({
  activityData,
  studentsData,
  resultsData,
  loading,
  classid,
}) => {
  if (loading || !resultsData || resultsData.length === 0) {
    return <div>Loading results...</div>;
  }

  // Extract all answers from results
  const allAnswers = resultsData[0].risultati
  ? Object.values(resultsData[0].risultati).flatMap((res) => {
      if (!res.answers) return [];
      
      // For each date in answers, get all question answers
      return Object.values(res.answers).flatMap((dateAnswers) => 
        Object.values(dateAnswers).map((q) => q.message)
      );
    })
  : [];

  // Group answers by date
  const answersByDate = {};
if (resultsData[0].risultati) {
  Object.values(resultsData[0].risultati).forEach((res) => {
    if (res.answers) {
      Object.entries(res.answers).forEach(([date, dateAnswers]) => {
        if (!answersByDate[date]) {
          answersByDate[date] = [];
        }
        // Push all question answers for this date
        Object.values(dateAnswers).forEach((question) => {
          answersByDate[date].push(question.message);
        });
      });
    }
  });
}

  // Get user info by ID
  const getUserById = (id) => {
    return studentsData.find((user) => user.id === id) || {};
  };

  return (
    <div className="container mt-5">

      {console.log(allAnswers)}
      {/* Word Cloud for all answers */}
      
      <div className="mb-5">
        <h3>All Responses Word Cloud</h3>
        <div style={{ height: "650px", background: "white", padding: "20px", borderRadius: "8px" }}>
          <WordCloudComponent 
            answers={allAnswers}
            colors={{
              border: '#3f51b5',
              text: '#212121'
            }}
          />
        </div>
      </div>
      

      {/* Answers grouped by date */}
      <Accordion>
        {Object.entries(answersByDate).map(([date, answers], index) => (
          <Accordion.Item eventKey={index.toString()} key={date}>
            <Accordion.Header>Risposte da {date}</Accordion.Header>
            <Accordion.Body>
              {/* Word Cloud for this date */}
              <div style={{ height: "600px", marginBottom: "20px" }}>
                <WordCloudComponent 
                  answers={answers}
                  colors={{
                    border: '#4caf50',
                    text: '#212121'
                  }}
                />
              </div>

              {/* List of individual responses */}
              <h5>Risposte Individuali:</h5>
              <ListGroup>
                {Object.values(resultsData[0].risultati)
                  .filter((res) => res.answers && res.answers[date])
                  .map((res, idx) => {
                    const user = getUserById(res.user);
                    return (
                      <ListGroup.Item key={idx}>
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              user.propic ||
                              "https://cdn-icons-png.flaticon.com/512/4869/4869736.png"
                            }
                            alt="Profile"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              marginRight: "15px",
                            }}
                          />
                          <div>
                            <strong>
                              {user.nome} {user.cognome}
                            </strong>
                            <div><u>{activityData.domande[0].testo}</u>: {res.answers[date]?.q1?.message}</div>
                            <div><u>{activityData.domande[1].testo}</u>: {res.answers[date]?.q2?.message}</div>
                            <div><u>{activityData.domande[2].testo}</u>: {res.answers[date]?.q3?.message}</div>
                            <div><u>{activityData.domande[3].testo}</u>: {res.answers[date]?.q4?.message}</div>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default DailyReflectionActivity;
