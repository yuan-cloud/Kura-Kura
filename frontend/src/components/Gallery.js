import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import GlowyCritter from "@/components/GlowyCritter";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Gallery = () => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/gallery`);
      setAvatars(response.data);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link to="/" className="inline-block mb-6">
            <button className="ritual-button" data-testid="back-button">
              ← Back to Generator
            </button>
          </Link>
          <h1 className="serif text-4xl md:text-5xl font-semibold mb-4" data-testid="gallery-heading">
            Gallery of Rituals
          </h1>
          <p className="text-base opacity-70">Every repository has a rhythm</p>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20" data-testid="loading">
            <div className="w-8 h-8 border-2 border-t-transparent border-current rounded-full animate-spin" />
          </div>
        ) : avatars.length === 0 ? (
          <div className="text-center py-20 opacity-60" data-testid="empty-state">
            <p className="text-lg">No spirits generated yet.</p>
            <p className="text-sm mt-2">Be the first to summon a repository spirit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="gallery-grid">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className="glass-panel p-4 smooth-transition hover:scale-105"
                data-testid={`gallery-item-${avatar.id}`}
              >
                <div className="canvas-stage mb-3">
                  <div style={{ width: "100%", aspectRatio: "1/1" }}>
                    <GlowyCritter config={avatar.params} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium mb-1">{avatar.repo_name}</p>
                  <a
                    href={`https://github.com/${avatar.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                    data-testid={`github-link-${avatar.id}`}
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center text-sm opacity-50">
          Created by Yuan — at the intersection of code and cinema.
        </footer>
      </div>
    </div>
  );
};

export default Gallery;