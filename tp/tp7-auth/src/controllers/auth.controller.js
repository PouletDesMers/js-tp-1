// Contrôleur d'authentification : que dit la requête, que répondre ?
// Aucune règle ici : le service compare les mots de passe et signe les jetons.

export function createAuthController({ authService }) {
  return {
    async login(req, res) {
      const { email, password } = req.validated;
      res.json(await authService.login(email, password));
    },

    async refresh(req, res) {
      res.json(await authService.refresh(req.validated.refresh_token));
    },

    async register(req, res) {
      res.status(201).json(await authService.register(req.validated));
    },

    me(req, res) {
      res.json(req.user); // l'utilisateur du jeton
    },
  };
}
