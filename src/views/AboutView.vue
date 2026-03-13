<template>
  <div class="about-page">
    <h1>À propos</h1>

    <section>
      <h2>Qu'est-ce que Clean Playlist ?</h2>
      <p>
        Clean Playlist est un outil de référence recensant les artistes ayant fait l'objet de comportements problématiques documentés : violences sexuelles, racisme, homophobie, pédophilie, et bien d'autres.
      </p>
    </section>

    <section>
      <h2>Comment utiliser la liste ?</h2>
      <p>
        Rendez-vous sur la page <a href="/list">Liste</a> pour parcourir l'ensemble des artistes répertoriés. Vous pouvez rechercher un artiste par son nom ou filtrer par catégorie. Chaque entrée est accompagnée de sources vérifiables.
      </p>
    </section>

    <section>
      <h2>Critères d'inclusion</h2>
      <p>
        Chaque artiste présent dans cette liste a fait l'objet de faits documentés et sourcés. Les accusations non vérifiées ou les simples rumeurs ne sont pas retenues. Les sources sont privilégiées lorsqu'elles proviennent de médias reconnus, de décisions de justice ou de témoignages publics.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Pour toute question, signalement ou suggestion, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:contact@example.com">contact@example.com</a>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2rem;
}

section {
  margin-bottom: 2rem;
}

h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
}

p {
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.7;
}

a {
  color: var(--link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
