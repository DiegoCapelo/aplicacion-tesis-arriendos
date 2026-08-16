import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="login-page">
          <section className="login-panel">
            <p className="eyebrow">Error de interfaz</p>
            <h1>No se pudo cargar la pantalla</h1>
            <p className="muted">
              Reinicia el frontend y refresca la pagina con Ctrl + F5.
            </p>
            <pre className="error-box">{String(this.state.error.message || this.state.error)}</pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
