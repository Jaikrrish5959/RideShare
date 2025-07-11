import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from '../services/axiosConfig';

const RideRequests = ({ user }) => {
  const [requests, setRequests] = useState({ 
    incoming: [], 
    outgoing: [], 
    pastTrips: [] 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [success, setSuccess] = useState('');
  const [updatingRequests, setUpdatingRequests] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/trips/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

      const filterRequests = (requests) => {
        return requests.reduce((acc, request) => {
          try {
            const tripDateTime = new Date(`${request.Trip.date}T${request.Trip.time}`);
            if (isNaN(tripDateTime.getTime())) {
              console.error('Invalid date/time for request:', request);
              return acc;
            }
            
            if (tripDateTime < twoHoursAgo && request.status === 'accepted') {
              acc.past.push(request);
            } else if (tripDateTime >= twoHoursAgo || request.status === 'pending') {
              acc.current.push(request);
            }
          } catch (error) {
            console.error('Error processing request:', error, request);
          }
          return acc;
        }, { current: [], past: [] });
      };

      const incomingFiltered = filterRequests(response.data.incoming);
      const outgoingFiltered = filterRequests(response.data.outgoing);

      setRequests({
        incoming: incomingFiltered.current,
        outgoing: outgoingFiltered.current,
        pastTrips: [...incomingFiltered.past, ...outgoingFiltered.past]
      });
      setError('');
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch ride requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('RideRequests component mounted');

    const initFetch = async () => {
      try {
        if (mounted) {
          await fetchData();
        }
      } catch (error) {
        if (mounted) {
          setError('Failed to fetch ride requests');
        }
      }
    };

    initFetch();

    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleRequestUpdate = async (requestId, status) => {
    try {
      setUpdatingRequests(prev => ({ ...prev, [requestId]: true }));
      const token = localStorage.getItem('token');
      await axios.put(`/api/trips/requests/${requestId}`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setError('');
      setSuccess(`Request ${status} successfully`);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      await fetchData();
    } catch (error) {
      setSuccess('');
      if (error.response?.status === 400 && error.response.data.message.includes('No seats')) {
        setError('No seats available. All pending requests have been automatically rejected.');
      } else {
        setError(error.response?.data?.message || 'Failed to update request');
      }
    } finally {
      setUpdatingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const renderIncomingRequests = () => (
    requests.incoming.map(request => (
      <Card key={request.id} className="mb-3 trip-card">
        <div className="trip-header">
          <Card.Title className="trip-title">
            {request.Trip.start_point} → {request.Trip.destination}
          </Card.Title>
        </div>
        <div className="trip-content">
          <div className="trip-info-grid">
            <div className="trip-info-item">
              <span className="trip-info-label">Date</span>
              <span className="trip-info-value">{request.Trip.date}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Time</span>
              <span className="trip-info-value">{request.Trip.time}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Passenger</span>
              <span className="trip-info-value">{request.requester?.username || request.requester?.email || 'Unknown'}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Phone</span>
              <span className="trip-info-value">{request.requester?.phoneNumber ? 
                request.requester.phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2') : 
                'Not provided'}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Status</span>
              <span className={`trip-info-value fw-bold text-${getStatusColor(request.status)}`}>
                {request.status.toUpperCase()}
              </span>
            </div>
          </div>
          {request.status === 'pending' && (
            <div className="trip-actions">
              <Button 
                className="action-button edit-button"
                onClick={() => handleRequestUpdate(request.id, 'accepted')}
                disabled={updatingRequests[request.id]}
              >
                Accept
              </Button>
              <Button 
                className="action-button delete-button"
                onClick={() => handleRequestUpdate(request.id, 'rejected')}
                disabled={updatingRequests[request.id]}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </Card>
    ))
  );

  const renderOutgoingRequests = () => (
    requests.outgoing.map(request => (
      <Card key={request.id} className="mb-3 trip-card">
        <div className="trip-header">
          <Card.Title className="trip-title">
            {request.Trip.start_point} → {request.Trip.destination}
          </Card.Title>
        </div>
        <div className="trip-content">
          <div className="trip-info-grid">
            <div className="trip-info-item">
              <span className="trip-info-label">Date</span>
              <span className="trip-info-value">{request.Trip.date}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Time</span>
              <span className="trip-info-value">{request.Trip.time}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Host</span>
              <span className="trip-info-value">{request.Trip.User?.username || request.Trip.User?.email || 'Unknown'}</span>
            </div>
            <div className="trip-info-item">
              <span className="trip-info-label">Status</span>
              <span className={`trip-info-value fw-bold text-${getStatusColor(request.status)}`}>
                {request.status.toUpperCase()}
              </span>
            </div>
            {request.status === 'accepted' && (
              <div className="trip-info-item">
                <span className="trip-info-label">Contact Phone</span>
                <span className="trip-info-value">{request.Trip.User?.phoneNumber ? 
                  request.Trip.User.phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2') : 
                  'Not provided'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    ))
  );

  const renderPastTrips = () => (
    requests.pastTrips.map(request => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isIncoming = request.Trip?.userId === user?.id;
        
        if (!request.Trip) {
          console.error('Trip data missing for request:', request);
          return null;
        }

        return (
          <Card key={request.id} className="mb-3 trip-card">
            <div className="trip-header">
              <Card.Title className="trip-title">
                {request.Trip.start_point} → {request.Trip.destination}
              </Card.Title>
              <span className="trip-badge past-badge">Past Trip</span>
            </div>
            <div className="trip-content">
              <div className="trip-info-grid">
                <div className="trip-info-item">
                  <span className="trip-info-label">Date</span>
                  <span className="trip-info-value">{request.Trip.date}</span>
                </div>
                <div className="trip-info-item">
                  <span className="trip-info-label">Time</span>
                  <span className="trip-info-value">{request.Trip.time}</span>
                </div>
                <div className="trip-info-item">
                  <span className="trip-info-label">Status</span>
                  <span className={`trip-info-value fw-bold text-${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <div className="trip-info-item">
                  <span className="trip-info-label">{isIncoming ? 'Passenger' : 'Host'}</span>
                  <span className="trip-info-value">
                    {isIncoming ? 
                      (request.requester?.username || request.requester?.email || 'Unknown') :
                      (request.Trip.User?.username || request.Trip.User?.email || 'Unknown')}
                  </span>
                </div>
                {request.status === 'accepted' && (
                  <div className="trip-info-item">
                    <span className="trip-info-label">Contact Phone</span>
                    <span className="trip-info-value">
                      {isIncoming ? 
                        (request.requester?.phoneNumber || 'Not provided') :
                        (request.Trip.User?.phoneNumber || 'Not provided')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      } catch (error) {
        console.error('Error rendering past trip:', error, request);
        return null;
      }
    }).filter(Boolean)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  if (loading) return <Container className="mt-4"><div>Loading...</div></Container>;

  return (
    <Container className="mt-4">
      <h2>Ride Requests</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => {
          setActiveTab(k);
          setError('');
          setSuccess('');
        }}
        className="mb-3"
      >
        <Tab eventKey="incoming" title={`Incoming Requests (${requests.incoming.length})`}>
          {requests.incoming.length === 0 ? (
            <Alert variant="info">No incoming requests</Alert>
          ) : renderIncomingRequests()}
        </Tab>
        <Tab eventKey="outgoing" title={`My Requests (${requests.outgoing.length})`}>
          {requests.outgoing.length === 0 ? (
            <Alert variant="info">You haven't requested any rides yet</Alert>
          ) : renderOutgoingRequests()}
        </Tab>
        <Tab eventKey="past" title={`Past Trips (${requests.pastTrips.length})`}>
          {requests.pastTrips.length === 0 ? (
            <Alert variant="info">No past trips</Alert>
          ) : renderPastTrips()}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default RideRequests;