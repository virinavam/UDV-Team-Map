import React from "react";
import AuthScreen from "./components/auth/AuthScreen";

export default function App() {
  const handleAuthenticated = () => {
    console.log("Пользователь вошёл!");
  };

  return <AuthScreen onAuthenticated={handleAuthenticated} />;
}
