import React from 'react';
import PropTypes from 'prop-types';
import './header.component.css';

const Header = ({ title, subtitle, supportingData }) => {
    return (
        <div className="header">
            <div className="header-content">
                <h1 className="header-title">{title}</h1>
                {subtitle && <h2 className="header-subtitle">{subtitle}</h2>}
                {supportingData && (
                    <div className="header-supporting-data">
                        {supportingData.map((item, index) => (
                            <div key={index} className="supporting-data-item">
                                {item}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

Header.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    supportingData: PropTypes.arrayOf(PropTypes.node),
};

Header.defaultProps = {
    subtitle: null,
    supportingData: null,
};

export default Header;
