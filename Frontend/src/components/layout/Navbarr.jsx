import React from "react";
import chatinLogo from "../../assets/chatin.png";
import UserProfile from "./UserProfile";

const Navbar = () => {
  return (
    <nav className="relative">
      <div className="container mx-auto flex items-center mt-5 ml-10">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img src={chatinLogo} alt="Chatin Logo" className="h-7 w-auto" />
        </a>
      </div>

      {/* User Profile dipisah dan posisinya fix di kanan */}
      <div className="absolute right-7 top-4 -translate-y-1/2">
        <UserProfile />
      </div>
    </nav>
  );
};

export default Navbar;
