import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { actionLogout } from '../../actions/authActions';
import AppContext from '../../AppContext';

export default function LogoutButton() {

    const userState = useContext(AppContext);

    const LogoutButton = styled.button`
        display: inline-block;
        padding: 8px 10px;
        border: solid 0.5px #AE86FF;
        border-radius: 10px;
        background-color: #6F48BD;
        color: #AE86FF;
        font-size: 1rem;
        cursor: pointer;
        text-decoration: none;
        transition: background 250ms ease-in-out, 
                    transform 150ms ease;
        -webkit-appearance: none;
        -moz-appearance: none;
        &:hover,
        &:focus {
            background: white;
            color: #6F48BD;
        }
        &:focus {
            outline: 1px solid #fff;
            outline-offset: -4px;
        }
        &:active {
            transform: scale(0.99);
        }
        p {
            margin: 0;
        }
    `;

    const handleLogout = () => {
        userState.isConnectedSocket.emit('logout');
        userState.toggleConnected();
        actionLogout();
    };

    return (
        <Link 
            to="/"
            onClick={handleLogout}
        >
            <LogoutButton>
                <p>Logout</p>
            </LogoutButton>
        </Link>
    );
}