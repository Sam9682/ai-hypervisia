export const HomePage = () => {
  return (
    <div className="px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenue à HYPERVISIA
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Association loi 1901 dédiée à la promotion et au développement de nos activités communes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Notre Mission</h2>
          <p className="text-gray-600">
            Créer un espace d'échange et de collaboration pour nos membres, 
            favorisant le partage de connaissances et l'entraide.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Nos Activités</h2>
          <p className="text-gray-600">
            Organisation d'événements, ateliers, conférences et rencontres 
            pour enrichir la vie associative.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Rejoignez-nous</h2>
          <p className="text-gray-600">
            Devenez membre et participez activement à la vie de l'association. 
            Ensemble, construisons notre communauté.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
        <div className="space-y-2 text-gray-600">
          <p><strong>Adresse:</strong> [Adresse de l'association]</p>
          <p><strong>Email:</strong> contact@hypervisia.fr</p>
          <p><strong>Téléphone:</strong> [Numéro de téléphone]</p>
        </div>
      </div>
    </div>
  );
};
