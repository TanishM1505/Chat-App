import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backEndUrl = import.meta.env.VITE_BACKEND_URL;
//adding backend url as base url in axios

axios.defaults.baseURL = backEndUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  //Check if the user is authenticated and if so, set the user data and connect the socket
  const checkAuth = async () => {
    try {
      const data = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //Login and Signup Function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //Logout funciton to handle user logout and socket disconnection

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged Out Successfully");
    socket.disconnect();
  };

  //Update profile Function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //Connect Socket Function to handle socket connection and online users updates
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backEndUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  //Need to run the above function whenever we open the web page so we need to use the useEffect hook

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      //Will add this token for all the Api req made by axios when token is available in the local storage
    }
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
