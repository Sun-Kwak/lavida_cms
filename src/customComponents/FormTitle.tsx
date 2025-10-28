import React from 'react';
import styled from 'styled-components';

interface FormTitleProps {
  children: React.ReactNode;
  className?: string;
}

const StyledFormTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: #000;
  text-align: left;
  margin: 0;
`;

export const FormTitle: React.FC<FormTitleProps> = ({ children, className }) => {
  return (
    <StyledFormTitle className={className}>
      {children}
    </StyledFormTitle>
  );
};

export default FormTitle;
