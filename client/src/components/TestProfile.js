import React, { Fragment, useContext, useEffect, useState } from 'react';
import AppContext from '../AppContext';
import axios from 'axios';


export default function TestProfile(props) {
    const userState = useContext(AppContext);
    // const [isConnected, setIsConnected] = useState(false);
    const username = props.match.params.username;

    // useEffect(() => {
    //     // userState.socket.send(`${username} says HELLO from the client`);
    //     userState.socket.on('isConnected', usernames => {
    //         console.log(usernames);
    //         usernames.includes(username) ? setIsConnected(true) : setIsConnected(false); 
    //         // setIsConnected(res);
    //     });
    //     userState.socket.emit('subscribeToIsConnected');
    //     // userState.socket.emit('subscribeToIsConnected', username);
    // }, []);

    useEffect(() => {
        userState.socket.emit('visit', username);
        const authToken = localStorage.getItem('token');
        const visitedUsername = username;
        axios.post(`/notifications/visited?authToken=${authToken}`, { visitedUsername });
    }, []);

    return (
        <Fragment>
            <p>Username: {username}</p>
            <p>Connected ?: {userState.connectedUsers.includes(username) ? 'true' : 'false'}</p>
        </Fragment>
    );
};
