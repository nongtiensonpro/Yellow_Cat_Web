"use client"
import React from 'react';
import styled from 'styled-components';

const Love = () => {
    return (
        <StyledWrapper>
            <div className="loader" />
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .loader {
    width: 3.5em; 
    height: 2.5em; 
    position: relative;
    animation: beat 1s infinite;
  }

  .loader::before,
  .loader::after {
    content: "";
    position: absolute;
    top: 0;
    width: 25px; 
    height: 40px; 
    border-radius: 2.5em 2.5em 0 0; 
    animation: coldblue 1s infinite;
  }

  .loader::before {
    left: 25px; // Giảm từ 50px xuống 25px
    transform: rotate(-45deg);
    transform-origin: 0 100%;
  }

  .loader::after {
    left: 0;
    transform: rotate(45deg);
    transform-origin: 100% 100%;
  }

  @keyframes beat {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.2);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes coldblue {
    0%, 100% {
      background-color: rgb(255, 255, 255);
    }

    50% {
      background-color: rgb(198, 23, 23);
    }
  }`;

export default Love;
