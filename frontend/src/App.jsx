import React, {useState, useEffect} from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import AuthScreen from "./components/auth/AuthScreen";
import EmployeesPage from "./pages/EmployeesPage";
import TeamMapPage from "./pages/TeamMapPage";
import {authAPI} from "./lib/api";
import {Spinner, Center} from "@chakra-ui/react";

function ProtectedRoute({element, isAuthenticated, isLoading}) {
    if (isLoading) {
        return (
            <Center h="100vh" w="100vw">
                <Spinner size="lg" color="blue.500"/>
            </Center>
        );
    }
    return isAuthenticated ? element : <Navigate to="/" replace/>;
}

export default function App() {
    console.log("App mounted")
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("useEffect fired");
        (async () => {
            setIsLoading(true);
            try {
                const user = await authAPI.getCurrentUser();
                setCurrentUser(user);
                setIsAuthenticated(!!user);
            } catch (err) {
                console.error("Auth check error:", err);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);


    const handleAuthenticated = () => {
        console.log("Пользователь вошёл!");
        setIsAuthenticated(true);
    };

    return (
        <Routes>
            <Route
                path="/"
                element={
                    isLoading ? (
                        <Center h="100vh" w="100vw">
                            <Spinner size="lg" color="blue.500"/>
                        </Center>
                    ) : isAuthenticated ? (
                        <Navigate to="/employees" replace/>
                    ) : (
                        <AuthScreen onAuthenticated={handleAuthenticated}/>
                    )
                }
            />
            <Route
                path="/employees"
                element={
                    <ProtectedRoute
                        element={
                            <EmployeesPage/>
                        }
                        isAuthenticated={isAuthenticated}
                        isLoading={isLoading}
                    />
                }
            />
            <Route
                path="/team-map"
                element={
                    <ProtectedRoute
                        element={
                            <TeamMapPage/>
                        }
                        isAuthenticated={isAuthenticated}
                        isLoading={isLoading}
                    />
                }
            />
        </Routes>
    );
}
