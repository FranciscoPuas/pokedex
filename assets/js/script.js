$(document).ready(function () {
  const apiURL = "https://pokeapi.co/api/v2/pokemon";
  const pokemonContainer = $("#pokemon-container");
  const searchInput = $("#search-input");
  const searchButton = $("#search-button");
  const pokemonDetails = $("#pokemon-details");
  const pokemonModal = $("#pokemonModal");

  const regionRanges = {
    kanto: { start: 1, end: 151 },
    johto: { start: 152, end: 251 },
    hoenn: { start: 252, end: 386 },
    sinnoh: { start: 387, end: 493 },
    unova: { start: 494, end: 649 },
    kalos: { start: 650, end: 721 },
  };

  let currentRegion = "kanto";

  // Cargar Pokémon de una región específica
  const loadPokemonsByRegion = async (region) => {
    pokemonContainer.empty();
    const { start, end } = regionRanges[region];
    for (let i = start; i <= end; i++) {
      try {
        const pokemon = await $.get(`${apiURL}/${i}`);
        displayPokemonCard(pokemon);
      } catch (error) {
        console.error(`Error cargando Pokémon #${i}:`, error);
      }
    }
  };

  // Mostrar la card del Pokémon
  const displayPokemonCard = (pokemon) => {
    const pokemonCard = `
        <div class="col-lg-3 col-md-4 col-sm-6">
          <div class="card">
            <div class="card-img-container">
              <img src="${
                pokemon.sprites.front_default
              }" class="card-img-top" alt="${pokemon.name} normal">
              <img src="${
                pokemon.sprites.front_shiny
              }" class="card-img-top" alt="${pokemon.name} shiny">
            </div>
            <div class="card-body">
              <h5 class="card-title">${pokemon.name.toUpperCase()}</h5>
              <p class="card-text">ID: ${pokemon.id}</p>
              <p class="card-text">Tipo: ${pokemon.types
                .map((type) => type.type.name)
                .join(", ")}</p>
            </div>
          </div>
        </div>`;
    pokemonContainer.append(pokemonCard);
  };

  // Buscar Pokémon por nombre o ID
  const searchPokemon = async () => {
    const searchTerm = searchInput.val().toLowerCase();
    if (searchTerm) {
      try {
        const pokemon = await $.get(`${apiURL}/${searchTerm}`);
        displayPokemonDetails(pokemon);
        pokemonModal.modal("show");
      } catch (error) {
        alert("Pokémon no encontrado.");
        console.error("Error buscando Pokémon:", error);
      }
    }
  };

  // Mostrar detalles del Pokémon
  const displayPokemonDetails = async (pokemon) => {
    try {
      const speciesData = await $.get(pokemon.species.url);
      const evolutionChainUrl = speciesData.evolution_chain.url;
      const evolutionChain = await $.get(evolutionChainUrl);

      const moves = pokemon.moves
        .filter(
          (move) =>
            move.version_group_details[0].move_learn_method.name === "level-up"
        )
        .sort(
          (a, b) =>
            a.version_group_details[0].level_learned_at -
            b.version_group_details[0].level_learned_at
        );

      pokemonDetails.html(`
          <h2>${pokemon.name.toUpperCase()}</h2>
          <div class="row">
            <div class="col-md-6">
              <img src="${pokemon.sprites.front_default}" alt="${
        pokemon.name
      } normal">
              <img src="${pokemon.sprites.front_shiny}" alt="${
        pokemon.name
      } shiny">
            </div>
            <div class="col-md-6">
              <p><strong>ID:</strong> ${pokemon.id}</p>
              <p><strong>Tipo:</strong> ${pokemon.types
                .map((type) => type.type.name)
                .join(", ")}</p>
              <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
              <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
            </div>
          </div>
          <h4>Ataques por Nivel</h4>
          <ul class="move-list">
            ${moves
              .map(
                (move) => `
              <li>
                <span class="move-level">Nv. ${move.version_group_details[0].level_learned_at}</span>
                - ${move.move.name}
              </li>`
              )
              .join("")}
          </ul>
          <h4>Cadena Evolutiva</h4>
          <ul>${getEvolutions(evolutionChain.chain)}</ul>
        `);
    } catch (error) {
      console.error("Error mostrando detalles del Pokémon:", error);
      pokemonDetails.html("<p>Error al cargar los detalles del Pokémon.</p>");
    }
  };

  // Obtener cadena de evoluciones
  const getEvolutions = (chain) => {
    let evolutions = `<li>${chain.species.name}</li>`;
    if (chain.evolves_to && chain.evolves_to.length) {
      evolutions += `<ul>${chain.evolves_to
        .map((evolution) => getEvolutions(evolution))
        .join("")}</ul>`;
    }
    return evolutions;
  };

  // Configurar eventos
  searchButton.on("click", searchPokemon);
  searchInput.on("keypress", function (e) {
    if (e.which === 13) {
      searchPokemon();
    }
  });

  $(".nav-link").on("click", function (e) {
    e.preventDefault();
    currentRegion = $(this).data("region");
    loadPokemonsByRegion(currentRegion);
    $(".nav-item").removeClass("active");
    $(this).parent().addClass("active");
  });

  // Cargar Pokémon de Kanto inicialmente
  loadPokemonsByRegion(currentRegion);
});
