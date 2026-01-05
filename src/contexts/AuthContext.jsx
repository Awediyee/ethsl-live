import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import ApiService from '../services/api';
import { User } from '../models/User';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkExistingAuth();
    }, []);

    const checkExistingAuth = () => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                ApiService.setAuthToken(token);

                // Decode token to get user info if not provided in response
                const decodedToken = ApiService.decodeJWT(token);
                let savedUser = null;
                try {
                    savedUser = JSON.parse(localStorage.getItem('userData'));
                } catch (e) {
                    console.error('Error parsing saved user data', e);
                }

                // Merge decoded data with saved data
                // Priority: savedUser > decodedToken
                const rawUserData = { ...decodedToken, ...savedUser };

                if ((decodedToken || savedUser)) {
                    const userModel = new User(rawUserData);
                    setUser(userModel);
                    setIsLoggedIn(true);
                }
            }
        } catch (error) {
            console.error("Auth initialization error", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('=== AuthContext.login() called ===')
            console.log('Email:', email)

            const response = await ApiService.login(email, password);
            console.log('=== API Response received ===')
            console.log('Full response:', response)
            console.log('Response keys:', Object.keys(response))

            let token = null;
            let rawUser = null;

            // Extract token
            if (response.token || response.access_token || response.data?.token || response.data?.['jwt-token']) {
                token = response.token || response.access_token || response.data?.token || response.data?.['jwt-token'];
                console.log('Token found in response:', token ? 'YES' : 'NO')
                console.log('Token length:', token?.length)
                localStorage.setItem('authToken', token);
                ApiService.setAuthToken(token);
            } else {
                console.warn('⚠️ No token found in response!')
            }

            // Decode token for partial user info
            const decodedUser = token ? ApiService.decodeJWT(token) : null;
            console.log('Decoded user from token:', decodedUser)

            // Extract user object from response
            if (response.user) {
                rawUser = { ...decodedUser, ...response.user };
                console.log('User found in response.user')
            } else if (response.data?.user) {
                rawUser = { ...decodedUser, ...response.data.user };
                console.log('User found in response.data.user')
            } else {
                // Fallback if no explicit user object
                rawUser = { ...decodedUser, email: decodedUser?.email || email };
                console.log('Using decoded token as user (fallback)')
            }

            console.log('Raw user data:', rawUser)

            // Ensure email exists
            if (rawUser && !rawUser.email && rawUser.sub && rawUser.sub.includes('@')) {
                rawUser.email = rawUser.sub;
                console.log('Email extracted from sub:', rawUser.email)
            }

            if (!rawUser.email) rawUser.email = email;

            localStorage.setItem('userData', JSON.stringify(rawUser));

            const userModel = new User(rawUser);
            console.log('=== User Model Created ===')
            console.log('User model:', userModel)
            console.log('Role:', userModel.role)
            console.log('Is Admin:', userModel.isAdmin)

            setUser(userModel);
            setIsLoggedIn(true);

            return userModel;
        } catch (error) {
            console.error('=== AuthContext.login() ERROR ===');
            console.error('Error:', error);
            console.error('Error status:', error.status);
            console.error('Error data:', error.data);
            throw error;
        }
    };

    const setAuthData = (user, token) => {
        if (token) {
            localStorage.setItem('authToken', token);
            ApiService.setAuthToken(token);
        }

        if (user) {
            // Ensure email exists
            if (!user.email && user.sub && user.sub.includes('@')) {
                user.email = user.sub;
            }

            localStorage.setItem('userData', JSON.stringify(user));
            const userModel = new User(user);
            setUser(userModel);
            setIsLoggedIn(true);
            return userModel;
        }
        return null;
    };

    const register = async (email, password) => {
        // Just passes through to API, actual state update happens after OTP usually
        // But based on App.jsx, register just triggers OTP modal, so logic stays there mostly?
        // Wait, App.jsx `handleRegister` just sets local state.
        // We'll expose the API call here.
        return ApiService.register(email, password);
    };

    const verifyOTP = async (email, code) => {
        try {
            const response = await ApiService.verifyOTP(email, code);

            // Handle auth after OTP similarly to login
            if (response.token || response.access_token) {
                const token = response.token || response.access_token;
                localStorage.setItem('authToken', token);
                ApiService.setAuthToken(token);
            }

            let rawUser = null;
            if (response.user) {
                rawUser = response.user;
                // Merge with existing if needed, but usually response.user is fresh
                if (!rawUser.email) rawUser.email = email;
            } else {
                // Try to decode if we have token
                rawUser = ApiService.getCurrentUser();
                if (rawUser && !rawUser.email) rawUser.email = email;
            }

            if (rawUser) {
                localStorage.setItem('userData', JSON.stringify(rawUser));
                const userModel = new User(rawUser);
                setUser(userModel);
                setIsLoggedIn(true);
                return userModel;
            }

            return null;
        } catch (error) {
            console.error('Verify OTP failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await ApiService.logout();
        } catch (e) {
            console.warn("Logout api failed, clearing local state anyway");
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        ApiService.setAuthToken(null);
        setIsLoggedIn(false);
        setUser(null);
        // window.location.reload(); // App.jsx does this, maybe we should too or let the UI react?
        // ideally proper state management avoids reload, but let's keep it safe if user depends on it.
        // actually, let's try to avoid reload for a cleaner SPA experience unless necessary.
    };

    const updateUser = (data) => {
        setUser(prev => new User({ ...prev, ...data }));
    };

    const value = useMemo(() => ({
        isLoggedIn,
        user,
        loading,
        login,
        logout,
        register,
        verifyOTP,
        updateUser,
        setAuthData
    }), [isLoggedIn, user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
