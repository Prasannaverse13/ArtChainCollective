import React from 'react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-dark-indigo/80 backdrop-blur-md mt-auto py-4 px-6 border-t border-electric-blue/30">
      <div className="max-w-7xl mx-auto flex justify-center">
        <div className="text-electric-blue/80 text-sm">
          © {new Date().getFullYear()} ArtChain
        </div>
      </div>
    </footer>
  );
}

export default Footer;
