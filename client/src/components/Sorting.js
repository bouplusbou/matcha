import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';


export default function UserCard({sortingChoice, selectSorting}) {
    const [showChoices, setShowChoices] = useState(false);

    const Sorting = styled.div`
        position: relative;
        cursor: pointer;
    `;

    const Hover = styled.div`
        z-index: 10;
        position: absolute;
        width: 70%;
        margin-top: 15px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        border-radius: 15px;
        background-color: white;
        padding: 10px 20px;
        text-align: right;
        p {
            cursor: pointer;
            &:hover { color: #FF0041; }
        }
    `;

    const toggleHover = () => { setShowChoices(!showChoices) };

    return (
        <Sorting onClick={toggleHover} >
            <span style={{color: '#CBCBCB', marginRight: '5px'}}>Sort by:</span> {sortingChoice} <FontAwesomeIcon style={{color: '#FF0041', margin: '0 8px'}} icon={faChevronDown}/>
            { showChoices && 
            <Hover>
                <p onClick={selectSorting}>Youngest</p>
                <p onClick={selectSorting}>Oldest</p>
                <div style={{borderBottom: 'solid 0.5px ghostwhite'}}></div>
                <p onClick={selectSorting}>Most famous</p>
                <p onClick={selectSorting}>Least famous</p>
            </Hover>
            }
        </Sorting>  
    );
}
