import React from 'react';
import styles from "./Nav.module.css";
import postureLogo from "../../assets/images/postureLogo.png";
import { Link } from "react-router-dom";
import Dropdown from '../Dropdown.jsx';

const Nav = () => {
    return (
        <nav className={styles.navbar}>
            <div className={styles['logo-container']}>
                <span><img src={postureLogo} width="250" height="75" alt="Logo" /></span>
            </div>
            <Dropdown />
            <div className={styles['links-container']}>
                <div className={styles['link']}>
                    <Link to="/Home">Home</Link>
                </div>
                <div className={styles['link']}>
                    <Link to="/Camera">Camera</Link>
                </div>
                <div className={styles['link']}>
                    <Link to="/SignIn">Sign In</Link>
                </div>
            </div>
        </nav>
    );
};

export default Nav;
