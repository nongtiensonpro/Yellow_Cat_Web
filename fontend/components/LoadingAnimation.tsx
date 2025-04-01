"use client"
import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  .loader {
    color: rgb(124, 124, 124);
    font-family: "Poppins", sans-serif;
    font-weight: 500;
    font-size: 25px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    border-radius: 8px;
  }

  .words {
    overflow: hidden;
    position: relative;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--bg-color) 10%,
      transparent 30%,
      transparent 70%,
      var(--bg-color) 90%
    );
    z-index: 20;
  }

  .word {
    display: block;
    height: 100%;
    padding-left: 6px;
    animation: spin_4991 4s infinite;
  }

  @keyframes spin_4991 {
    10% {
      -webkit-transform: translateY(-102%);
      transform: translateY(-102%);
    }

    25% {
      -webkit-transform: translateY(-100%);
      transform: translateY(-100%);
    }

    35% {
      -webkit-transform: translateY(-202%);
      transform: translateY(-202%);
    }

    50% {
      -webkit-transform: translateY(-200%);
      transform: translateY(-200%);
    }

    60% {
      -webkit-transform: translateY(-302%);
      transform: translateY(-302%);
    }

    75% {
      -webkit-transform: translateY(-300%);
      transform: translateY(-300%);
    }

    85% {
      -webkit-transform: translateY(-402%);
      transform: translateY(-402%);
    }

    100% {
      -webkit-transform: translateY(-400%);
      transform: translateY(-400%);
    }
  }`;

const LoadingAnimation = () => {
    return (
        <StyledWrapper>
            <div className="xl">
                <div className="loader">
                    <p>Made with love from </p>
                    <div className="words">
                        <span className="word" style={{ color: 'red' }}> Red</span>
                        <span className="word" style={{ color: 'yellow' }}> Yellow </span>
                        <span className="word" style={{ color: 'orange' }}> Orange </span>
                        <span className="word" style={{ color: 'green' }}> Green </span>
                        <span className="word" style={{ color: 'blue' }}> Blue </span>
                    </div>
                    <p> Cat</p>
                </div>
            </div>
        </StyledWrapper>
    );
}

export default LoadingAnimation;
