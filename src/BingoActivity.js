import React from 'react';
import { ProgressBar, Accordion, Card, Alert, Spinner, Badge } from 'react-bootstrap';

const BingoActivity = ({ activityData, studentsData, resultsData, loading, classid }) => {
  // 1. SAFELY EXTRACT AND NORMALIZE ALL DATA
  const tasks = normalizeTasks(activityData?.domande);
  const students = Array.isArray(studentsData) ? studentsData : [];
  
  // Handle both old and new results structure
  const results = normalizeResults(resultsData);

  // Helper function to ensure tasks are always an array of proper objects
  function normalizeTasks(rawTasks) {
    // If already proper array, return it
    if (Array.isArray(rawTasks)) return rawTasks;
    
    // If it's an object, convert to array
    if (rawTasks && typeof rawTasks === 'object') {
      return Object.entries(rawTasks).map(([id, task]) => ({
        id: task.id || id,
        testo: task?.testo || `Task ${id}`
      }));
    }
    
    // Default empty array
    return [];
  }

  // Helper to normalize results from both old and new structure
  function normalizeResults(rawResults) {
    if (!rawResults) return {};
    
    // New structure has risultati object with numeric keys
    if (rawResults[0]?.risultati) {
      const normalized = {};
      Object.entries(rawResults[0].risultati).forEach(([key, result]) => {
        if (result.user) {
          normalized[result.user] = {
            completedTasks: getCompletedTasksFromNewStructure(result),
            completionDate: result.completionDate || 'Date not recorded',
            user: result.user
          };
        }
      });
      return normalized;
    }
    
    // Old structure is already in the right format
    return rawResults;
  }

  // Extract completed tasks from new structure's answers object
  function getCompletedTasksFromNewStructure(result) {
    if (!result.answers) return [];
    
    // Convert answers object to array of completed task IDs
    return Object.entries(result.answers)
      .filter(([_, value]) => value === true)
      .map(([taskId]) => parseInt(taskId));
  }

  // Loading state
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p>Loading activity data...</p>
      </div>
    );
  }

  // No tasks case
  if (tasks.length === 0) {
    return (
      <Alert variant="warning" className="m-3">
        <strong>No valid tasks found.</strong> Please check the activity configuration.
      </Alert>
    );
  }

  // Calculate task completion percentage
  const getTaskCompletion = (taskId) => {
    if (students.length === 0 || !results) return 0;

    const classStudents = students.filter(s => s.classe === classid);
    if (classStudents.length === 0) return 0;
    
    const completedCount = Object.values(results).filter(
      result => {
        const tasks = result?.completedTasks;
        console.log(tasks);
        if (Array.isArray(tasks)) {
          return tasks.includes(taskId);
        }
        return false;
      }
    ).length;

    return Math.round((completedCount / classStudents.length) * 100);
  };

  // Get students who completed a specific task
  const getCompletedStudents = (taskId) => {
    if (!results) return [];
  
    return Object.values(results)
      .filter((result) => {
        const tasks = result?.completedTasks;
        const studentId = result?.user;
        
        if (!studentId) return false;
        
        if (Array.isArray(tasks)) {
          return tasks.includes(taskId);
        }
        
        return false;
      })
      .map((result) => {
        const studentId = result.user;
        const student = students.find(s => s?.id === studentId);
        
        if (!student) {
          console.warn(`Student ${studentId} not found in students list`);
          return null;
        }
        
        return {
          ...student,
          completionDate: result.completionDate,
          score: result.punteggio || 0, // Add score from new structure if available
          currency: result.obtainedCurrency || 0 // Add currency from new structure if available
        };
      })
      .filter(Boolean);
  };

  return (
    <div className="bingo-container p-3">
      <h3 className="mb-4 d-flex align-items-center">
        <Badge bg="primary" className="me-2">Bingo</Badge>
        {activityData?.nome || 'Bingo Activity'}
      </h3>

      <div className="tasks-list">
        {tasks.map((task, index) => {
          const completion = getTaskCompletion(task.id);
          const completedStudents = getCompletedStudents(task.id);

          return (
            <div key={task.id || index} className="task-card mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">
                  {task.testo || `Task ${index + 1}`}
                </h5>
                <Badge bg={completion === 100 ? 'success' : 'primary'}>
                  {completion}%
                </Badge>
              </div>

              <ProgressBar 
                now={completion} 
                variant={completion === 100 ? 'success' : 'primary'}
                className="mb-3"
                animated={completion < 100}
              />

              <Accordion>
                <Accordion.Item eventKey={index.toString()}>
                  <Accordion.Header>
                    {completedStudents.length > 0 ? (
                      `${completedStudents.length} student${completedStudents.length !== 1 ? 's' : ''} completed`
                    ) : (
                      'No completions yet'
                    )}
                  </Accordion.Header>
                  <Accordion.Body>
                    {completedStudents.length > 0 ? (
                      <div className="row">
                        {completedStudents.map(student => (
                          <div className="col-md-2 mb-3" key={student.id}>
                            <Card className="student-completion-card">
                              <div className="student-image-wrapper">
                                <Card.Img 
                                  variant="top"
                                  src={student.propic || 'https://cdn-icons-png.flaticon.com/512/4869/4869736.png'}
                                  alt={`${student.nome} ${student.cognome}`}
                                />
                              </div>
                              <Card.Body className="student-details">
                                <Card.Title className="student-name">
                                  {student.nome} {student.cognome}
                                </Card.Title>
                              </Card.Body>
                            </Card>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="light" className="mb-0">
                        Waiting for students to complete this task...
                      </Alert>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BingoActivity;