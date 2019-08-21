import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

const StyledDiv = styled.div `
    display:flex;
    height:80px;

    overflow:hidden;
    align-items:center;
    border-radius:${props => props.theme.borderRadius};
    
    background-color:#FBF9FF;
    box-shadow: 0px 20px 20px rgba(0, 0, 0, 0.1);
`

const ProfilePhoto = styled.img `
    height:100%;
    width:80px;

    object-fit:cover;
`

const InfosContainer = styled.div `
    display:flex;
    flex-direction:column;
    justify-content:center;
    flex:1;
    padding:0.5rem;
`

const Username = styled.span `
    font-size:1.25rem;
    color:${props => props.color};
    font-weight:600;
`

const Age = styled.span `
    font-size:1.15rem;
    color: #8c92a6;
    font-weight:400;
`

const StyledButton = styled(FontAwesomeIcon) `
    border-radius:100%;
    border:1px solid ${props => props.color};
    padding:0.75rem;
    margin-right:0.75rem;
    box-shadow: 0px 0px 10px ${props => props.color};
`

export default function UserListItem(props) {
    
    
    return (
        <StyledDiv>
            <ProfilePhoto src={props.photos[props.avatar]}/>
            <InfosContainer>
                <Username color={props.color}>{props.username}</Username>
                <Age>{props.age}, {props.localisation}</Age>
            </InfosContainer>
            <StyledButton icon={faHeart} size={"lg"} color={props.color}/>
        </StyledDiv>
    )
}