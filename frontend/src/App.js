import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Truck, MapPin, Shield, BarChart3, Users, Clock, CheckCircle } from "lucide-react";
// The styles are now imported from a global CSS file.
import './global.css';
// Gemini API configuration
const API_URL = "https://generativelanguage.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=";
const API_KEY = ""; // Canvas will automatically provide the API key at runtime.

// Mock data for shipment statuses
const statusMap = {
  '123': 'In Transit',
  '456': 'Out for Delivery',
  '789': 'Delivered',
};

// --- Custom components updated to use global CSS classes ---

/**
 * A custom Button component styled with global CSS.
 */
const Button = ({ children, className, variant, size, asChild, ...props }) => {
  let finalClassNames = `button ${className || ''}`;

  if (variant === "outline") {
    finalClassNames += ' button-outline';
  } else if (variant === "secondary") {
    finalClassNames += ' button-secondary';
  }

  if (size === "lg") {
    finalClassNames += ' button-lg';
  }

  if (asChild) {
    return React.cloneElement(children, { className: finalClassNames, ...props });
  }

  return (
    <button className={finalClassNames} {...props}>
      {children}
    </button>
  );
};

/**
 * A custom Card component styled with global CSS.
 */
const Card = ({ children, className }) => (
  <div className={`card ${className || ''}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className }) => (
  <div className={`card-header ${className || ''}`}>
    {children}
  </div>
);
const CardContent = ({ children, className }) => (
  <div className={`card-content ${className || ''}`}>
    {children}
  </div>
);
const CardTitle = ({ children, className }) => (
  <h4 className={`card-title ${className || ''}`}>
    {children}
  </h4>
);
const CardDescription = ({ children, className }) => (
  <p className={`card-description ${className || ''}`}>
    {children}
  </p>
);

/**
 * A custom Badge component styled with global CSS.
 */
const Badge = ({ children, className, variant }) => {
  let finalClassNames = `badge ${className || ''}`;
  if (variant === "secondary") {
    finalClassNames += ' badge-secondary';
  }
  return (
    <span className={finalClassNames}>
      {children}
    </span>
  );
};


// --- Pages ---

/**
 * The main landing page of the application.
 */
const HomePage = () => {
  return (
    <div className="home-page-container">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="flex-center">
              <Truck className="header-icon" />
              <h1 className="header-title">SupplyTrack Pro</h1>
            </div>
            <nav className="header-nav">
              <Link to="/dashboard/supplier" className="nav-link">For Suppliers</Link>
              <Link to="/dashboard/driver" className="nav-link">For Drivers</Link>
              <Link to="/track/123" className="nav-link">For Consumers</Link>
              <Link to="/dashboard/admin" className="nav-link">Admin</Link>
            </nav>
            <div className="flex-center gap-3">
              <Button variant="outline" className="sign-in-button">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container text-center max-w-4xl">
          <Badge className="badge-hero" variant="secondary">
            Real-time Supply Chain Intelligence
          </Badge>
          <h2 className="hero-title">
            Predict Risks, Track Shipments,<br /><span className="hero-title-accent">Deliver Excellence</span>
          </h2>
          <p className="hero-description">
            Complete supply chain visibility with AI-powered risk prediction, real-time GPS tracking, and seamless
            collaboration between suppliers, drivers, and consumers.
          </p>
          <div className="flex-center flex-col sm:flex-row gap-4">
            <Button size="lg">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="features-section">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="section-title">Everything You Need for Supply Chain Excellence</h3>
            <p className="section-description">
              From predictive analytics to real-time tracking, our platform provides comprehensive tools for modern
              supply chain management.
            </p>
          </div>

          <div className="grid-responsive grid-gap-6">
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <Shield className="feature-icon" />
                  </div>
                  <CardTitle>Risk Prediction</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered analysis of weather, traffic, and route conditions to predict and prevent delays before
                  they happen.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <MapPin className="feature-icon" />
                  </div>
                  <CardTitle>Live GPS Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time location updates from driver mobile devices with automatic status notifications and ETA
                  calculations.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <BarChart3 className="feature-icon" />
                  </div>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive insights into delivery performance, risk patterns, and operational efficiency metrics.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <Users className="feature-icon" />
                  </div>
                  <CardTitle>Multi-Role Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tailored dashboards for suppliers, drivers, consumers, and administrators with role-based permissions.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <Clock className="feature-icon" />
                  </div>
                  <CardTitle>Real-time Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Instant notifications for delays, route changes, delivery confirmations, and risk warnings.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex-center gap-3">
                  <div className="icon-bg-blue">
                    <CheckCircle className="feature-icon" />
                  </div>
                  <CardTitle>Mobile Optimized</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Fully responsive design ensures seamless experience across desktop, tablet, and mobile devices.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="user-roles-section">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="section-title">Built for Every Role in Your Supply Chain</h3>
            <p className="section-description">
              Specialized tools and interfaces designed for suppliers, drivers, consumers, and administrators.
            </p>
          </div>

          <div className="grid-responsive grid-gap-6">
            <Card className="hover-shadow">
              <CardHeader className="text-center">
                <div className="icon-wrapper">
                  <Truck className="role-icon" />
                </div>
                <CardTitle>Suppliers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Create shipments, assign drivers, track deliveries, and monitor supply chain performance.
                </CardDescription>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/supplier">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-shadow">
              <CardHeader className="text-center">
                <div className="icon-wrapper">
                  <MapPin className="role-icon" />
                </div>
                <CardTitle>Drivers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Mobile-friendly interface for GPS tracking, status updates, and route optimization.
                </CardDescription>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/driver">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-shadow">
              <CardHeader className="text-center">
                <div className="icon-wrapper">
                  <Users className="role-icon" />
                </div>
                <CardTitle>Consumers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Track your shipments in real-time and receive updates on delivery status and ETAs.
                </CardDescription>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/track/123">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-shadow">
              <CardHeader className="text-center">
                <div className="icon-wrapper">
                  <BarChart3 className="role-icon" />
                </div>
                <CardTitle>Administrators</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Comprehensive analytics, user management, and system oversight capabilities.
                </CardDescription>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/admin">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center max-w-3xl">
          <h3 className="cta-title">Ready to Transform Your Supply Chain?</h3>
          <p className="cta-description">
            Join thousands of businesses already using SupplyTrack Pro to optimize their logistics operations.
          </p>
          <div className="flex-center flex-col sm:flex-row gap-4">
            <Button size="lg" variant="secondary">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="cta-button-outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="flex-center gap-2 mb-4">
                <Truck className="footer-icon" />
                <span className="footer-title">SupplyTrack Pro</span>
              </div>
              <p className="footer-text">
                Advanced supply chain management with real-time tracking and predictive analytics.
              </p>
            </div>
            <div>
              <h4 className="footer-heading">Platform</h4>
              <ul className="footer-list">
                <li><Link to="/dashboard/supplier" className="footer-link">For Suppliers</Link></li>
                <li><Link to="/dashboard/driver" className="footer-link">For Drivers</Link></li>
                <li><Link to="/track/123" className="footer-link">For Consumers</Link></li>
                <li><Link to="/dashboard/admin" className="footer-link">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Features</h4>
              <ul className="footer-list">
                <li>Risk Prediction</li>
                <li>GPS Tracking</li>
                <li>Analytics</li>
                <li>Mobile App</li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-list">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Contact Support</li>
                <li>System Status</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 SupplyTrack Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * A page to track a specific package.
 */
const TrackingPage = () => {
  const { trackingCode } = useParams();
  const [friendlyStatus, setFriendlyStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentStatus = statusMap[trackingCode] || 'Status Unknown';

  const generateFriendlyStatus = async () => {
    setIsLoading(true);
    setFriendlyStatus('');

    try {
      const prompt = `Create a friendly and conversational status update for a package with tracking code ${trackingCode}, which has a current status of "${currentStatus}". Keep the response brief and positive.`;
      
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };

      const response = await fetch(API_URL + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setFriendlyStatus(text);
      } else {
        setFriendlyStatus('Could not generate a friendly status.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setFriendlyStatus('Failed to generate status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tracking-page-container">
      <h1 className="tracking-title">Tracking Page</h1>
      <p className="tracking-code-text">Tracking Code: <span className="tracking-code">{trackingCode}</span></p>
      <p className="tracking-status-text">Current Status: <span className="tracking-status">{currentStatus}</span></p>

      <button
        onClick={generateFriendlyStatus}
        className="tracking-button"
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Friendly Status ✨'}
      </button>
      
      {friendlyStatus && (
        <div className="tracking-result">
          <p className="tracking-result-heading">Friendly Update:</p>
          <p className="tracking-result-text">{friendlyStatus}</p>
        </div>
      )}
    </div>
  );
};

// Mock components for other dashboards
const SupplierDashboard = () => (
  <div className="dashboard-container">
    <h1 className="dashboard-title">Supplier Dashboard</h1>
    <p className="dashboard-text">Welcome to the supplier portal. This is where you can manage your orders and shipments.</p>
  </div>
);

const DriverDashboard = () => (
  <div className="dashboard-container">
    <h1 className="dashboard-title">Driver Dashboard</h1>
    <p className="dashboard-text">Welcome, driver. View your assigned routes and delivery schedules here.</p>
  </div>
);

const AdminDashboard = () => (
  <div className="dashboard-container">
    <h1 className="dashboard-title">Admin Dashboard</h1>
    <p className="dashboard-text">Welcome, admin. This dashboard provides an an overview of all system activities.</p>
  </div>
);

/**
 * A simple 404 page for unmatched routes.
 */
const PageNotFound = () => (
  <div className="not-found-container">
    <h1 className="not-found-title">404 - Page Not Found</h1>
    <p className="not-found-text">The page you're looking for does not exist.</p>
  </div>
);

// Main App component which sets up the routing
export default function App() {
  return (
    <Router>
      <main className="min-h-screen-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/track/:trackingCode" element={<TrackingPage />} />
          <Route path="/dashboard/supplier" element={<SupplierDashboard />} />
          <Route path="/dashboard/driver" element={<DriverDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
    </Router>
  );
}
