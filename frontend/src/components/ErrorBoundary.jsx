"use client";

import React, { Component } from "react";
import ErrorFallback from "./ErrorFallback";

/**
 * React Error Boundary Class Component (Pure JavaScript)
 * Catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays ErrorFallback UI instead of crashing into a blank screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled component error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          statusCode={this.props.statusCode || 500}
          title={this.props.title || "Terjadi Kesalahan Komponen"}
          description={
            this.state.error?.message ||
            this.props.description ||
            "Komponen ini mengalami kesalahan yang tidak dapat diproses secara normal."
          }
          error={this.state.error}
          primaryAction={{
            label: "Coba Lagi",
            onClick: this.handleReset,
          }}
          secondaryAction={{
            label: "Kembali ke Beranda",
            href: "/",
          }}
          showHomeButton={true}
          fullPage={this.props.fullPage !== undefined ? this.props.fullPage : false}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
