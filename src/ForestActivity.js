import React from 'react';
import { Card, Accordion, Badge, Spinner, Alert, ProgressBar, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Tree, TreeFill, XCircle } from 'react-bootstrap-icons';

const ForestActivity = ({ activityData, studentsData, resultsData, loading, classid }) => {
  // Normalize students data
  const students = Array.isArray(studentsData) ? studentsData : [];
  
  // Normalize results data
  const results = normalizeResults(resultsData);

  const LineSeparator = () => (
  <hr
    style={{
      border: 'none',
      borderTop: '2px dashed #ccc',
      margin: '2rem 0',
      width: '100%',
      opacity: 0.6,
    }}
  />
);

  // Helper to normalize results from both old and new structure
  function normalizeResults(rawResults) {
    if (!rawResults || rawResults.length === 0) return {};
    
    // Extract risultati from programmate
    const risultati = rawResults[0]?.risultati || {};
    
    const normalized = {};
    Object.entries(risultati).forEach(([userId, result]) => {
      if (result.user) {
        normalized[result.user] = {
          foresta: result.foresta || [],
          user: result.user
        };
      }
    });
    return normalized;
  }

  // Loading state
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p>Loading forest data...</p>
      </div>
    );
  }

  // No results case
  if (Object.keys(results).length === 0) {
    return (
      <Alert variant="warning" className="m-3">
        <strong>No forest data found.</strong> Students haven't planted any trees yet.
      </Alert>
    );
  }

  // Calculate tree statistics for a student
  const getTreeStats = (userId) => {
    const studentResult = results[userId];
    if (!studentResult || !studentResult.foresta) {
      return { healthy: 0, damaged: 0, total: 0 };
    }

    const foresta = Array.isArray(studentResult.foresta) ? studentResult.foresta : [];
    
    return {
      healthy: foresta.filter(tree => tree.tipoAlbero === "sano").length,
      damaged: foresta.filter(tree => tree.tipoAlbero === "danneggiato").length,
      total: foresta.length
    };
  };

  // Calculate overall class statistics
  const getClassTreeStats = () => {
    let healthy = 0;
    let damaged = 0;
    let total = 0;

    Object.values(results).forEach(result => {
      if (result.foresta) {
        const stats = getTreeStats(result.user);
        healthy += stats.healthy;
        damaged += stats.damaged;
        total += stats.total;
      }
    });

    return { healthy, damaged, total };
  };

  const classStats = getClassTreeStats();

  // Custom tree icons with consistent sizing
  const GreenTree = ({ size = 20 }) => (
    <TreeFill color="#28a745" size={size} className="healthy-tree" />
  );

  const RedTree = ({ size = 20 }) => (
    <TreeFill color="#dc3545" size={size} className="damaged-tree" />
  );

  const getClassTreesWithMetadata = () => {
  const allTrees = { healthy: [], damaged: [] };

  students
    .filter(student => student.classe === classid)
    .forEach(student => {
      const forest = results[student.id]?.foresta || [];
      forest.forEach(tree => {
        const entry = {
          ...tree,
          studentName: `${student.nome} ${student.cognome}`,
        };
        if (tree.tipoAlbero === "sano") {
          allTrees.healthy.push(entry);
        } else if (tree.tipoAlbero === "danneggiato") {
          allTrees.damaged.push(entry);
        }
      });
    });

  return allTrees;
};


  const TreeWithTooltip = ({ type = "healthy", tooltipText = "Tree info", size = 20 }) => {
  const IconComponent = type === "healthy" ? GreenTree : RedTree;

  return (
    <div className="tree-tooltip-wrapper">
      <IconComponent size={size} />
      <span className="tree-tooltip-text">{tooltipText}</span>
    </div>
  );
};


  const renderTreeIcons = (trees = [], type = "healthy") => {
  return (
    <div className="d-flex flex-wrap align-items-center" style={{ minHeight: '24px' }}>
      {trees.length > 0 ? (
        trees.map((tree, i) => (
          <TreeWithTooltip
            key={`${type}-tree-${i}`}
            type={type}
            tooltipText={
              <>
                <div><strong>Date:</strong> {tree.data || "N/A"}</div>
                <div><strong>Timer:</strong> {tree.timer} min</div>
              </>
            }
            size={20}
          />
        ))
      ) : (
        <span className="text-muted small">None</span>
      )}
    </div>
  );
};

const renderClassTreeIcons = (trees = [], type = "healthy") => {
  return (
    <div className="d-flex flex-wrap align-items-center" style={{ minHeight: '24px' }}>
      {trees.length > 0 ? (
        trees.map((tree, i) => (
          <TreeWithTooltip
            key={`${type}-class-tree-${i}`}
            type={type}
            tooltipText={
              <>
                <div><strong>Student:</strong> {tree.studentName}</div>
                <div><strong>Date:</strong> {tree.data || "N/A"}</div>
                <div><strong>Timer:</strong> {tree.timer} min</div>
              </>
            }
            size={20}
          />
        ))
      ) : (
        <span className="text-muted small">None</span>
      )}
    </div>
  );
};





  return (
    <div className="forest-container p-3" style={{ backgroundColor: '#f8f9fa' }}>
      <h3 className="mb-4 d-flex align-items-center">
        <TreeFill color="#28a745" size={28} className="me-2" />
        {activityData?.nome || 'Forest Activity'}
        <TreeFill color="#28a745" size={28} className="ms-2" />
      </h3>

      {/* Class summary */}
      <Card className="mb-4 border-success">
        <Card.Header className="bg-success text-white">
          <Tree className="me-2" />
          Class Forest Summary
          <Tree className="ms-2" />
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
        <div className="d-flex align-items-center">
          <GreenTree size={24} className="me-2" />
                <div className="ms-2">
                  <h6 className="mb-0">Healthy Trees</h6>
                  <h4 className="mb-0 text-success">{classStats.healthy}</h4>
                </div>
              </div>
            </Col>
            <Col md={4}>
        <div className="d-flex align-items-center">
          <RedTree size={24} className="me-2" />
                <div className="ms-2">
                  <h6 className="mb-0">Damaged Trees</h6>
                  <h4 className="mb-0 text-danger">{classStats.damaged}</h4>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center">
                <Tree color="#6c757d" size={24} className="me-2" />
                <div>
                  <h6 className="mb-0">Total Trees</h6>
                  <h4 className="mb-0 text-secondary">{classStats.total}</h4>
                </div>
              </div>
            </Col>
          </Row>
<LineSeparator />
          {/* Class-level Tree Details */}
<Row>
  <Col md={6}>
  {renderClassTreeIcons(getClassTreesWithMetadata().healthy, "healthy")}
</Col><Col md={6} className="d-flex justify-content-end">
  {renderClassTreeIcons(getClassTreesWithMetadata().damaged, "damaged")}
  </Col>
</Row>
<br></br>

          
          {classStats.total > 0 && (
            <div>
              <ProgressBar className="mb-2">
                <ProgressBar 
                  variant="success" 
                  now={(classStats.healthy / classStats.total) * 100} 
                  label={`${Math.round((classStats.healthy / classStats.total) * 100)}%`}
                />
                <ProgressBar 
                  variant="danger" 
                  now={(classStats.damaged / classStats.total) * 100} 
                  label={`${Math.round((classStats.damaged / classStats.total) * 100)}%`}
                />
              </ProgressBar>
              <div className="d-flex justify-content-between">
                <small className="text-success">
                  Healthy: {classStats.healthy}
                </small>
                <small className="text-danger">
                  Damaged: {classStats.damaged}
                </small>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Students list */}
      <Card className="border-primary">
        <Card.Header className="bg-primary text-white">
          <Tree className="me-2" />
          Students' Forests
          <Tree className="ms-2" />
        </Card.Header>
        <Card.Body className="p-0">
          <Accordion flush alwaysOpen className="custom-accordion">
            {students
              .filter(student => student.classe === classid)
              .map((student, index) => {
                const stats = getTreeStats(student.id);
                const hasForest = stats.total > 0;

                return (
                  <Accordion.Item eventKey={index.toString()} key={student.id}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center w-100">
                        <img 
                          src={student.propic || 'https://cdn-icons-png.flaticon.com/512/4869/4869736.png'} 
                          alt={`${student.nome} ${student.cognome}`}
                          className="me-3 rounded-circle"
                          style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-0">
                            {student.nome} {student.cognome}
                          </h6>
                          <small className="text-muted">
                            {hasForest ? (
                              <>
                                <span className="text-success me-2">
                                  <GreenTree size={18} className="me-1" />
                                  <span className="ms-1">{stats.healthy}</span>
                                </span>
                                <span className="text-danger">
                                  <RedTree size={18} className="me-1" />
                                  <span className="ms-1">{stats.damaged}</span>
                                </span>
                              </>
                            ) : (
                              <span className="text-muted">No trees planted</span>
                            )}
                          </small>
                        </div>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      {hasForest ? (
                        <div>
                          <Row className="mb-3">
                            <Col md={6}>
                              <h6 className="text-success">
                                Healthy Trees
                              </h6>
                              {renderTreeIcons(
  (results[student.id]?.foresta || []).filter(tree => tree.tipoAlbero === "sano"),
  "healthy"
)}
                            </Col>
                            <Col md={6}>
                              <h6 className="text-danger">
                                Damaged Trees
                              </h6>
                              {renderTreeIcons(
  (results[student.id]?.foresta || []).filter(tree => tree.tipoAlbero === "danneggiato"),
  "damaged"
)}

                            </Col>
                          </Row>
                          <div className="mt-3">
                            <h6>Tree Health Distribution</h6>
                            <ProgressBar>
                              <ProgressBar 
                                variant="success" 
                                now={(stats.healthy / stats.total) * 100} 
                                label={`${Math.round((stats.healthy / stats.total) * 100)}%`}
                              />
                              <ProgressBar 
                                variant="danger" 
                                now={(stats.damaged / stats.total) * 100} 
                                label={`${Math.round((stats.damaged / stats.total) * 100)}%`}
                              />
                            </ProgressBar>
                          </div>
                        </div>
                      ) : (
                        <Alert variant="light" className="mb-0 text-center">
                          <Tree color="#6c757d" size={48} className="mb-2" />
                          <h5>No Trees Planted Yet</h5>
                          <p className="mb-0">This student hasn't added any trees to their forest.</p>
                        </Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                );
              })}
          </Accordion>
        </Card.Body>
      </Card>
      {/* Add this CSS to ensure perfect alignment */}
      <style jsx>{`
        .healthy-tree, .damaged-tree {
          vertical-align: middle;
          line-height: 1;
        }
        .healthy-tree {
          color: #28a745 !important;
        }
        .damaged-tree {
          color: #dc3545 !important;
        }
         .tree-tooltip-wrapper {
    position: relative;
    display: inline-block;
    margin: 3px;
    cursor: pointer;
  }

  .tree-tooltip-wrapper .tree-tooltip-text {
    visibility: hidden;
    width: 160px;
    background-color: #343a40;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 6px 8px;
    position: absolute;
    z-index: 9999;
    bottom: 125%; /* Position above the icon */
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .tree-tooltip-wrapper:hover .tree-tooltip-text {
    visibility: visible;
    opacity: 1;
  }

  

      `}</style>
    </div>
  );
};

export default ForestActivity;