// src/components/EditCode.js
import React, { useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode } from '@docusaurus/theme-common';

/**
 * EditCode component
 */
const EditCode = ({ children, language = "" }) => {
  const {colorMode} = useColorMode();
  const isDarkTheme = colorMode === 'dark';
  
  const [activeInput, setActiveInput] = useState({
    placeholder: null,
    isDirty: false
  });
  
  const [editedValues, setEditedValues] = useState({});
  
  const [copied, setCopied] = useState(false);
  
  const getCodeContent = () => {
    if (typeof children === 'string') {
      return children.trim();
    }
    
    if (children && typeof children === 'object' && children.hasOwnProperty('raw')) {
      return children[0].trim();
    }
    
    if (children && typeof children === 'object' && children.props) {
      if (typeof children.props.children === 'string') {
        return children.props.children.trim();
      }
      
      if (children.props.children && typeof children.props.children === 'object') {
        if (typeof children.props.children === 'string') {
          return children.props.children.trim();
        } else if (children.props.children.props) {
          return children.props.children.props.children || '';
        }
      }
    }
    
    if (Array.isArray(children)) {
      let content = '';
      children.forEach(child => {
        if (typeof child === 'string') {
          content += child;
        } else if (child && child.props && child.props.children) {
          if (typeof child.props.children === 'string') {
            content += child.props.children;
          }
        }
      });
      return content.trim();
    }
    
    return '';
  };
  
  const findPlaceholders = (content) => {
    const placeholderRegex = /\$@([^@$]+)\$@/g;
    let match;
    const placeholders = [];
    
    while ((match = placeholderRegex.exec(content)) !== null) {
      placeholders.push({
        value: match[0],
        description: match[1]
      });
    }
    
    return placeholders;
  };
  
  const codeContent = getCodeContent();
  const placeholders = findPlaceholders(codeContent);
  
  const handlePlaceholderClick = (placeholder) => {
    setActiveInput({
      placeholder,
      isDirty: false
    });
  };
  
  const resetPlaceholder = (placeholder) => {
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[placeholder];
      return newValues;
    });
  };
  
  const handleDoubleClick = (placeholder) => {
    resetPlaceholder(placeholder);
  };
  
  const handleInputChange = (placeholder, value) => {
    if (!activeInput.isDirty) {
      setActiveInput(prev => ({
        ...prev,
        isDirty: true
      }));
    }
    
    setEditedValues(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };
  
  const handleInputKeyDown = (e, placeholder) => {
    if (e.key === 'Escape') {
      resetPlaceholder(placeholder);
      setActiveInput({
        placeholder: null,
        isDirty: false
      });
    } else if (e.key === 'Enter') {
      setActiveInput({
        placeholder: null,
        isDirty: false
      });
    }
  };
  
  const handleInputBlur = () => {
    setActiveInput({
      placeholder: null,
      isDirty: false
    });
  };
  
  const renderCode = () => {
    let content = codeContent;
    let elements = [];
    let lastIndex = 0;
    
    const sortedPlaceholders = [...placeholders].sort((a, b) => {
      const valueA = typeof a === 'string' ? a : a.value;
      const valueB = typeof b === 'string' ? b : b.value;
      const indexA = content.indexOf(valueA);
      const indexB = content.indexOf(valueB);
      return indexA - indexB;
    });
    
    sortedPlaceholders.forEach((placeholder, i) => {
      const placeholderValue = typeof placeholder === 'string' ? placeholder : placeholder.value;
      const description = typeof placeholder === 'object' && placeholder.description ? placeholder.description : "";
      const index = content.indexOf(placeholderValue, lastIndex);
      
      if (index !== -1) {
        if (index > lastIndex) {
          elements.push(content.substring(lastIndex, index));
        }
        
        const displayLabelMatch = placeholderValue.match(/\$@([^@$]+)\$@/);
        const displayLabel = displayLabelMatch ? displayLabelMatch[1] : placeholderValue;
        
        const currentValue = editedValues[placeholderValue] !== undefined ? 
                           editedValues[placeholderValue] : 
                           displayLabel;
        
        if (activeInput.placeholder === placeholderValue) {
          const displayValue = activeInput.isDirty ? 
                              (editedValues[placeholderValue] || '') : 
                              currentValue;
          
          elements.push(
            <input
              key={`input-${i}`}
              type="text"
              value={displayValue}
              onChange={(e) => handleInputChange(placeholderValue, e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, placeholderValue)}
              onBlur={handleInputBlur}
              autoFocus
              className="code-block-input"
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                backgroundColor: 'rgba(147, 112, 219, 0.1)',
                color: '#9370db',
                border: '1px solid #9370db',
                borderRadius: '3px',
                padding: '0 4px',
                margin: '0 2px',
                minWidth: '60px',
                width: `${Math.max((displayValue || '').length * 0.7, 6)}ch`
              }}
            />
          );
        } else {
          elements.push(
            <span
              key={`placeholder-${i}`}
              onClick={() => handlePlaceholderClick(placeholderValue)}
              onDoubleClick={() => handleDoubleClick(placeholderValue)}
              className="code-block-placeholder"
              title={`${description}${description ? '. ' : ''}Click to edit, double-click to reset.`}
              style={{
                backgroundColor: 'rgba(147, 112, 219, 0.1)',
                color: '#9370db',
                border: '1px solid #9370db',
                borderRadius: '3px',
                padding: '0 4px',
                margin: '0 2px',
                cursor: 'pointer'
              }}
            >
              {currentValue}
            </span>
          );
        }
        
        lastIndex = index + placeholderValue.length;
      }
    });
    
    if (lastIndex < content.length) {
      elements.push(content.substring(lastIndex));
    }
    
    return elements;
  };
  
  const getCodeWithValues = () => {
    let result = codeContent;
    Object.entries(editedValues).forEach(([placeholder, value]) => {
      const escapedPlaceholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = new RegExp(escapedPlaceholder, 'g');
      result = result.replace(pattern, value);
    });
    return result;
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeWithValues());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const backgroundColor = isDarkTheme ? '#1e2125' : '#f5f6f7';
  const borderColor = isDarkTheme ? '#444950' : '#eee';
  const textColor = isDarkTheme ? '#e3e3e3' : '#1c1e21';
  const buttonColor = isDarkTheme ? '#aaa' : '#606770';
  const buttonHoverColor = isDarkTheme ? '#fff' : '#3578e5';
  
  return (
    <div style={{ 
      position: 'relative', 
      margin: '1rem 0',
      backgroundColor: backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      overflow: 'hidden'
    }}>
      <pre style={{ 
        margin: 0,
        padding: '1rem 2.5rem 1rem 1rem', // Extra padding on right for copy button
        fontFamily: 'Inconsolata, SFMono-Regular, Menlo, Monaco, monospace',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        overflowX: 'auto',
        color: textColor
      }}>
        <code>
          {renderCode()}
        </code>
      </pre>
      
      {/* Copy button */}
      <button
        type="button"
        aria-label="Copy code to clipboard"
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '4px',
          color: buttonColor,
          cursor: 'pointer',
          transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = buttonHoverColor}
        onMouseOut={(e) => e.currentTarget.style.color = buttonColor}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default EditCode;
