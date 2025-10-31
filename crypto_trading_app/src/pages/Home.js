import "../css/Home.css";
import { Link } from "react-router-dom"

function Home(){
    return (
        <div className="home-container">
            <h1 className="home-title">Crypto Trading App</h1>
            <p className="home-desc">Trade crypto at your own risk</p>

            <div className="home-actions">
                <Link to="/login"><button>Login</button></Link>
                <Link to="/signup"><button>SignUp</button></Link>
            </div>
        </div>
    );
}
export default Home;