import React from 'react';

interface TextBoxProps {
  heading: string;
  head: string;
  subheading?: string; 
}

const tb1: React.FC<TextBoxProps> = ({
  heading,
  subheading,
  head
}) => {
  return (
    <div className="text-box">
      <h3 className={`text-box-heading text-[#898B90] text-${head}`}>{heading}</h3>
      {subheading && <p className="text-box-subheading font-semibold text-base w-[100px] truncate">{subheading}</p>}
    </div>
  );
};

export default tb1;
