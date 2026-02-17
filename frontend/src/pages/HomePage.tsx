export const HomePage = () => {
  return (
    <div className="px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-purple-400/20 blur-3xl -z-10"></div>
        <div className="inline-block mb-4">
          <span className="text-6xl animate-bounce inline-block">🚀</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Bienvenue à HYPERVISIA
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Association loi 1901 dédiée à la promotion et au développement de nos activités communes ✨
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/register" className="btn-primary">
            <span className="mr-2">🎯</span>
            Rejoindre l'aventure
          </a>
          <a href="/forum" className="btn-secondary">
            <span className="mr-2">💬</span>
            Découvrir le forum
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg card-hover border border-primary-100">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Notre Mission
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Créer un espace d'échange et de collaboration pour nos membres, 
            favorisant le partage de connaissances et l'entraide 🤝
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg card-hover border border-purple-100">
          <div className="text-5xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nos Activités
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Organisation d'événements, ateliers, conférences et rencontres 
            pour enrichir la vie associative 🎪
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg card-hover border border-pink-100">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
            Rejoignez-nous
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Devenez membre et participez activement à la vie de l'association. 
            Ensemble, construisons notre communauté 💪
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-16 text-white">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-primary-100">Membres actifs 👥</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-primary-100">Événements par an 📅</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-primary-100">Engagement communautaire ❤️</div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-primary-100">
        <div className="flex items-center mb-6">
          <span className="text-4xl mr-3">📧</span>
          <h2 className="text-3xl font-bold text-gray-900">Contactez-nous</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">📍</span>
              <div>
                <p className="font-semibold text-gray-900">Adresse</p>
                <p className="text-gray-600">[Adresse de l'association]</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✉️</span>
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <a href="mailto:contact@hypervisia.fr" className="text-primary-600 hover:text-primary-700 transition-colors">
                  contact@hypervisia.fr
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">📱</span>
              <div>
                <p className="font-semibold text-gray-900">Téléphone</p>
                <p className="text-gray-600">[Numéro de téléphone]</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Le saviez-vous ?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              HYPERVISIA est une association dynamique qui rassemble des passionnés 
              autour de projets communs. Rejoignez-nous pour faire partie d'une 
              communauté engagée et bienveillante !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
