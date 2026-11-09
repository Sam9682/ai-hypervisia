import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumService, type Topic } from '../services/forumService';
import { authService } from '../services/authService';
import { infoService, type Stats } from '../services/infoService';
import sampng from '../assets/Sam.png';
import ninipng from '../assets/Nini.png';
import hypervisiapng from '/hypervisia.png';

export const HomePage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    loadTopics();
    loadStats();
  }, []);

  const loadTopics = async () => {
    try {
      setLoadingTopics(true);
      // Utiliser l'endpoint public si l'utilisateur n'est pas connecté
      const data = isAuthenticated 
        ? await forumService.getTopics(false)
        : await forumService.getTopicsPublic();
      // Get only the 5 most recent topics
      setTopics(data.slice(0, 5));
    } catch (err) {
      console.error('Error loading topics:', err);
      // En cas d'erreur, on continue sans bloquer
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await infoService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      // En cas d'erreur, on utilise des valeurs par défaut
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-navy-900">
          Bienvenue à HYPERVISIA
        </h1>
        <div className="flex justify-center mb-6">
          <img 
            src={hypervisiapng} 
            alt="Différences entre l'Homme et l'IA" 
            className="max-w-2xl w-full h-auto rounded-lg border border-slate-200"
          />
        </div>
        <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
          L'Association a pour objet de promouvoir la compréhension, l'usage, la recherche appliquée et le développement de l'intelligence artificielle, notamment par :
        </p>
        <ul className="text-lg text-slate-600 max-w-3xl mx-auto mt-4 space-y-2 list-disc list-inside">
          <li>la compréhension de l'impact majeur sur l'évolution de la société,</li>
          <li>des actions de sensibilisation et de vulgarisation,</li>
          <li>des événements (conférences, rencontres, hackathons),</li>
          <li>l'accès à des outils, dont la plateforme <a href="https://softfluid.fr" target="_blank" rel="noopener noreferrer" className="bg-navy-100 text-navy-700 hover:text-navy-900 underline transition-colors px-1 rounded">softfluid.fr</a></li>
        </ul>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/register" className="btn-primary">
            Rejoindre l'aventure
          </a>
          <a href="/forum" className="btn-secondary">
            Découvrir le forum
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card card-hover p-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Notre Mission
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Créer un espace d'échange et de collaboration pour nos membres, 
            pour prendre conscience de l'impact de l'IA sur notre société.
            Ce site web a été spécifié, construit, deployé en moins de 24h pour un coût de €1.
          </p>
        </div>
        
        <div className="card card-hover p-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Nos Activités
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Utilisation d'une plateforme de test pour du 
            déploiement d'application web par des agents IA <a href="https://softfluid.fr" target="_blank" rel="noopener noreferrer" className="bg-navy-100 text-navy-700 hover:text-navy-900 underline transition-colors px-1 rounded">softfluid.fr</a>.
            Suppression des développeurs, testeurs, intégrateurs, SSII ... Ce site est deployé par des IA sur Softfluid.fr
          </p>
        </div>
        
        <div className="card card-hover p-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Rejoignez-nous
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Devenez membre et participez activement à la vie de l'association. 
            Ensemble, commençons par impulser la transformation de la société
            en commençant par l'Education et la Formation
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-16 text-center">
        <div className="kpi">
          <div className="kpi-value">
            {loadingStats ? '...' : (stats?.total_users || 0)}+
          </div>
          <div className="kpi-label">Membres actifs</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">
            {loadingStats ? '...' : (stats?.total_events || 0)}+
          </div>
          <div className="kpi-label">Événements programmés</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">
            {loadingStats ? '...' : (stats?.total_topics || 0)}+
          </div>
          <div className="kpi-label">Discussions du forum</div>
        </div>
      </div>

      {/* Forum Topics Section */}
      <div className="card p-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-navy-900">Discussions du Forum</h2>
          {isAuthenticated ? (
            <Link
              to="/forum"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-navy-700 hover:text-navy-900 hover:bg-navy-100 transition-colors"
            >
              Voir tout
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-sm"
            >
              Se connecter pour participer
            </Link>
          )}
        </div>

        {!isAuthenticated && (
          <div className="disclaimer mb-4">
            <p className="text-sm font-semibold mb-1">
              Aperçu des discussions du forum
            </p>
            <p className="text-sm">
              Connectez-vous pour accéder aux détails des discussions, participer et créer vos propres sujets.
            </p>
          </div>
        )}

        {loadingTopics ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-slate-600">Chargement...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">Aucun sujet pour le moment</p>
            <Link
              to="/forum/new"
              className="btn-primary text-sm"
            >
              Créer le premier sujet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => {
              // Afficher un lien cliquable pour tous les utilisateurs (connectés ou non)
              return (
                <div
                  key={topic.id}
                  className="block p-4 rounded-lg hover:bg-navy-100 transition-colors border border-slate-200 hover:border-navy-700"
                >
                  <div className="flex items-start justify-between">
                    <Link
                      to={`/forum/topics/${topic.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-base font-semibold text-slate-900 hover:text-navy-700 truncate">
                          {topic.title}
                        </h3>
                        {topic.is_pinned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-900">
                            Épinglé
                          </span>
                        )}
                        {!isAuthenticated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-900">
                            Lecture seule
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <span>{topic.author_name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(topic.created_at)}</span>
                      </div>
                    </Link>
                    <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                      <div className="inline-flex items-center px-3 py-1 rounded-lg bg-navy-100">
                        <span className="text-xs font-bold text-navy-900">
                          {topic.post_count} réponses
                        </span>
                      </div>
                      {!isAuthenticated && (
                        <a
                          href={`https://hypervisia.fr/api/forum/topics/${topic.id}/publichtml`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir le post
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-navy-900 mb-6">Contactez-nous</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900">Adresse</p>
              <p className="text-slate-600">2 square des coquelicots 91370 VERRIERES LE BUISSON</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Email</p>
              <a href="mailto:contact@hypervisia.fr" className="text-navy-700 hover:text-navy-900 transition-colors">
                contact@hypervisia.fr
              </a>
            </div>
          </div>
          <div className="bg-navy-100 p-6 rounded-lg">
            <h3 className="font-semibold text-navy-900 mb-3">Les membres du bureau ?</h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              - Samuel LEPETRE, Président, ingénieur informatique chez OVH (ex d'AWS), 35 ans d'expérience, Informaticien depuis l'Oric 1, IA depuis 2023 et depuis, tous les jours<br />
              - Nael LEPETRE, Secrétaire, étudiant en master de Math. et Centrale Lyon, 1ière génération de Maths par l'IA<br />
              - Thibaud BRUNEL, Trésorier, 25 ans d'expérience en informatique
            </p>
            <div className="flex items-center mt-4">
              <img src={sampng} alt="Président" className="h-32 w-auto mr-2 object-contain" />
              <img src={ninipng} alt="Secrétaire" className="h-32 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
