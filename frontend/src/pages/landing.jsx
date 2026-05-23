import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            {/* Glowing background graphics */}
            <div className="glow-blob blob-blue"></div>
            <div className="glow-blob blob-purple"></div>

            <nav>
                <div className='navHeader'>
                    <h2>Apna Video Call</h2>
                </div>
                <div className='navlist'>
                    <p className="navlist-item" onClick={() => router("/guest-meeting")}>Join as Guest</p>
                    <p className="navlist-item" onClick={() => router("/auth")}>Register</p>
                    <p className="navlist-item" onClick={() => router("/recordings")}>Recordings</p>
                    <button className="navlist-btn" onClick={() => router("/auth")}>Login</button>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="landingLeft">
                    <h1><span>Connect</span> with your loved ones, anywhere.</h1>
                    <p>Bridge the distance instantly with high-fidelity video calling, interactive screen sharing, and real-time collaborative whiteboards.</p>
                    <div className="landingBtnGroup">
                        <Link to="/auth" className="primary-btn">Get Started</Link>
                        <button onClick={() => router("/auth")} className="secondary-btn">Join Meeting</button>
                    </div>
                </div>
                
                <div className="landingRight">
                    {/* Simulated High-Fidelity UI mockup */}
                    <div className="mockupContainer">
                        <div className="mockupHeader">
                            <div className="mockupDot" style={{ background: '#ff5f56' }}></div>
                            <div className="mockupDot" style={{ background: '#ffbd2e' }}></div>
                            <div className="mockupDot" style={{ background: '#27c93f' }}></div>
                        </div>
                        <div className="mockupBody">
                            <div className="mockupVideoTile">
                                <div className="tileAvatar">JD</div>
                                <div className="mockupNameTag">Jane Doe (You)</div>
                            </div>
                            <div className="mockupVideoTile">
                                <div className="tileAvatar" style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>AS</div>
                                <div className="mockupNameTag">Alex Smith</div>
                            </div>
                            <div className="mockupVideoTile">
                                <div className="tileAvatar" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>ML</div>
                                <div className="mockupNameTag">Marie Laurent</div>
                            </div>
                            <div className="mockupVideoTile">
                                <div className="tileAvatar" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>RK</div>
                                <div className="mockupNameTag">Raj Kumar</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
