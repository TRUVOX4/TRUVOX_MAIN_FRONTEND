import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ isAdminLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate("/district-login");
  };

  const linkClass = (path) =>
    location.pathname === path
      ? "text-blue-600 font-semibold"
      : "text-gray-700 hover:text-blue-600";

  return (
    <nav className="bg-white shadow-md p-4 flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center space-x-4">
        <span className="font-bold text-lg cursor-pointer" onClick={() => navigate("/")}>
          ElectionApp
        </span>

        {/* Public links */}
        <Link className={linkClass("/Register")} to="/Register">
          Register
        </Link>
        <Link className={linkClass("/Verify")} to="/Verify">
          Verify
        </Link>
        <Link className={linkClass("/district-register")} to="/district-register">
          District Register
        </Link>
      </div>

      {/* Admin links */}
      <div className="flex items-center space-x-4 mt-2 md:mt-0">
        {!isAdminLoggedIn ? (
          <Link className={linkClass("/district-login")} to="/district-login">
            District Login
          </Link>
        ) : (
          <>
            <Link className={linkClass("/district-dashboard")} to="/district-dashboard">
              Dashboard
            </Link>
            <Link className={linkClass("/create-election")} to="/create-election">
              Create Election
            </Link>
            <Link className={linkClass("/view-election")} to="/view-election">
              All Elections
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
