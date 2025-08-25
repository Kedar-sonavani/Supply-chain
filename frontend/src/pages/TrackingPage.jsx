import React from 'react';
import { useParams } from 'react-router-dom';
import ShipmentMap from '../components/maps/ShipmentMap';

const TrackingPage = () => {
  const { shipmentId } = useParams();

  return (
    <div className="tracking-page">
      <h1>Track Your Shipment</h1>
      
      <ShipmentMap 
        shipmentId={shipmentId} 
        userRole="consumer" 
      />
      
      <div className="shipment-details">
        {/* Add shipment info here */}
      </div>
    </div>
  );
};

export default TrackingPage;
