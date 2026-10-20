function limpiarCuentasGuardadasUnaVez() {
    let marcaReinicio = "chichacookAccountsReset3000";
    try {
        if (localStorage.getItem(marcaReinicio) === "completado") return;
        localStorage.removeItem("chichacookUsers");
        localStorage.removeItem("chichacookUser");
        localStorage.setItem(marcaReinicio, "completado");

        let clavesSesion = [];
        for (let indice = 0; indice < sessionStorage.length; indice++) {
            let clave = sessionStorage.key(indice);
            if (clave === "chichacookSession" || clave === "chichacookUsersSession" ||
                clave.indexOf("chichacookBlackjack:") === 0 ||
                clave.indexOf("chichacookRouletteBets:") === 0 ||
                clave.indexOf("chichacookRouletteRound:") === 0) {
                clavesSesion.push(clave);
            }
        }
        clavesSesion.forEach(function(clave) {
            sessionStorage.removeItem(clave);
        });
    } catch (error) {
    }
}

limpiarCuentasGuardadasUnaVez();

function cargarCarrito() {
    try {
        let guardado = JSON.parse(sessionStorage.getItem("chichacookCart") || "[]");
        if (!Array.isArray(guardado)) return [];
        let opcionesToppingValidas = ["Ninguno", "Oreo", "M&M", "Chispas de chocolate"];
        return guardado.filter(function(producto) {
            if (!producto || producto.nombre !== "Chicha venezolana" || typeof producto.toppings !== "string") {
                return false;
            }
            let toppings = producto.toppings.split(", ");
            return toppings.length === 2 && toppings.every(function(topping) {
                return opcionesToppingValidas.includes(topping);
            }) && opcionesToppingValidas.includes(producto.extra) &&
                producto.precio === (producto.extra === "Ninguno" ? 1200 : 1400);
        }).map(function(producto) {
            return {
                nombre: producto.nombre,
                toppings: producto.toppings,
                extra: producto.extra,
                precio: producto.precio
            };
        });
    } catch (error) {
        return [];
    }
}

function guardarCarrito() {
    try {
        if (carrito.length) {
            sessionStorage.setItem("chichacookCart", JSON.stringify(carrito));
        } else {
            sessionStorage.removeItem("chichacookCart");
        }
        return true;
    } catch (error) {
        return false;
    }
}

let carrito = cargarCarrito();
let productoEditando = null;
let temporizadorResultadoJuego = null;
let temporizadorConfetiJuego = null;
let ventanaResultadoJuego = null;
let confetiJuego = null;

function limpiarConfetiJuego() {
    window.clearTimeout(temporizadorConfetiJuego);
    temporizadorConfetiJuego = null;
    if (confetiJuego) {
        confetiJuego.remove();
        confetiJuego = null;
    }
}

function mostrarConfetiJuego() {
    limpiarConfetiJuego();
    confetiJuego = document.createElement("div");
    confetiJuego.className = "game-confetti";
    confetiJuego.setAttribute("aria-hidden", "true");

    for (let indice = 0; indice < 42; indice++) {
        let pieza = document.createElement("span");
        pieza.className = "game-confetti-piece";
        pieza.style.left = Math.random() * 100 + "%";
        pieza.style.setProperty("--confetti-drift", (Math.random() * 260 - 130) + "px");
        pieza.style.animationDelay = Math.random() * 280 + "ms";
        pieza.style.animationDuration = 1800 + Math.random() * 800 + "ms";
        confetiJuego.append(pieza);
    }

    document.body.append(confetiJuego);
    temporizadorConfetiJuego = window.setTimeout(limpiarConfetiJuego, 3000);
}

function mostrarResultadoJuego(resultado, cantidad) {
    if (!ventanaResultadoJuego) {
        ventanaResultadoJuego = document.createElement("div");
        ventanaResultadoJuego.className = "game-result-popup";
        ventanaResultadoJuego.setAttribute("role", "status");
        ventanaResultadoJuego.setAttribute("aria-live", "assertive");
        ventanaResultadoJuego.setAttribute("aria-atomic", "true");
        document.body.append(ventanaResultadoJuego);
    }

    let titulo = resultado === "win"
        ? "¡Ganaste!"
        : resultado === "loss"
            ? "¡Has perdido!"
            : "Empate";
    let detalle = resultado === "tie"
        ? "No ganaste ni perdiste puntos."
        : (resultado === "win" ? "+" : "-") +
            cantidad.toLocaleString("es-CL") + " puntos";

    ventanaResultadoJuego.className = "game-result-popup is-" + resultado;
    ventanaResultadoJuego.replaceChildren();
    limpiarConfetiJuego();
    let tituloElemento = document.createElement("strong");
    tituloElemento.textContent = titulo;
    let detalleElemento = document.createElement("span");
    detalleElemento.textContent = detalle;
    ventanaResultadoJuego.append(tituloElemento, detalleElemento);
    if (resultado === "win") mostrarConfetiJuego();

    window.clearTimeout(temporizadorResultadoJuego);
    temporizadorResultadoJuego = window.setTimeout(function() {
        ventanaResultadoJuego.classList.remove("is-visible");
    }, 5000);
    ventanaResultadoJuego.classList.add("is-visible");
}

function actualizarCantidad() {
    document.querySelectorAll("#cantidad").forEach(function(elemento) {
        elemento.textContent = carrito.length;
    });
}

function agregar() {
    let topping1 = document.getElementById("topping1").value;
    let topping2 = document.getElementById("topping2").value;
    let extra = document.getElementById("extra").value;

    if (!obtenerCuentaSesion()) {
        try {
            sessionStorage.setItem("chichacookPendingProduct", JSON.stringify({ topping1, topping2, extra }));
            sessionStorage.setItem("chichacookContinueAfterLogin", "services-add-product");
        } catch (error) {
            sessionStorage.removeItem("chichacookPendingProduct");
            sessionStorage.removeItem("chichacookContinueAfterLogin");
            alert("Inicia sesión para agregar una chicha al carrito.");
            return;
        }
        alert("Para agregar una chicha al carrito debes iniciar sesión.");
        window.location.href = "login.html";
        return;
    }

    let precio = 1200;

    if (extra != "Ninguno") {
        precio = 1400;
    }

    let producto = {
        nombre: "Chicha venezolana",
        toppings: topping1 + ", " + topping2,
        extra: extra,
        precio: precio
    };

    carrito.push(producto);
    guardarCarrito();
    actualizarCantidad();

    let caja = document.getElementById("carrito");
    if (caja && caja.classList.contains("mostrar")) {
        renderizarCarrito();
    }

    alert("Chicha agregada al carrito");
}

function mostrarCarrito() {
    let caja = document.getElementById("carrito");
    if (!caja) return;

    caja.classList.toggle("mostrar");
    renderizarCarrito();
}

function opcionesTopping(seleccionado) {
    let toppings = ["Ninguno", "Oreo", "M&M", "Chispas de chocolate"];
    return toppings.map(function(topping) {
        let estado = topping === seleccionado ? " selected" : "";
        return "<option" + estado + ">" + topping + "</option>";
    }).join("");
}

function renderizarCarrito() {
    let caja = document.getElementById("carrito");
    if (!caja) return;
    let texto = "<h2>Carrito</h2>";

    if (carrito.length == 0) {
        texto += "<p>El carrito está vacío.</p>";
    } else {
        let total = 0;
        let cuentaRecompensa = obtenerCuentaSesion();
        let indiceToppingGratis = cuentaRecompensa && cuentaRecompensa.toppingGratisDisponible
            ? carrito.findIndex(function(producto) { return producto.extra !== "Ninguno"; })
            : -1;
        if (cuentaRecompensa && cuentaRecompensa.toppingGratisDisponible && indiceToppingGratis < 0) {
            texto += "<p>Tienes un topping extra gratis disponible. Elige un extra en una chicha para aplicarlo.</p>";
        }

        for (let i = 0; i < carrito.length; i++) {
            let producto = carrito[i];
            let toppingGratis = i === indiceToppingGratis;
            let precioProducto = producto.precio - (toppingGratis ? 200 : 0);
            texto += "<div class='cart-item'><strong>" + producto.nombre + "</strong>";

            if (productoEditando === i) {
                let toppings = producto.toppings.split(", ");
                texto +=
                    "<label for='editar-topping1-" + i + "'>Topping 1</label>" +
                    "<select id='editar-topping1-" + i + "'>" + opcionesTopping(toppings[0]) + "</select>" +
                    "<label for='editar-topping2-" + i + "'>Topping 2</label>" +
                    "<select id='editar-topping2-" + i + "'>" + opcionesTopping(toppings[1]) + "</select>" +
                    "<label for='editar-extra-" + i + "'>Extra</label>" +
                    "<select id='editar-extra-" + i + "'>" + opcionesTopping(producto.extra) + "</select>" +
                    "<div class='cart-actions'>" +
                    "<button class='boton' onclick='guardarEdicion(" + i + ")'>Guardar</button>" +
                    "<button class='boton' onclick='cancelarEdicion()'>Cancelar</button></div>";
            } else {
                texto +=
                    "<p>Toppings: " + producto.toppings +
                    "<br>Extra: " + producto.extra + (toppingGratis ? " (gratis por recompensa)" : "") +
                    "<br>Precio: $" + precioProducto.toLocaleString("es-CL") + "</p>" +
                    "<div class='cart-actions'>" +
                    "<button class='boton' onclick='editarProducto(" + i + ")'>Editar</button>" +
                    "<button class='boton' onclick='eliminarProducto(" + i + ")'>Eliminar</button></div>";
            }

            texto += "</div>";

            total += precioProducto;
        }

        texto +=
            "<hr><h3>Total: $" +
            total.toLocaleString("es-CL") +
            "</h3>";

        texto +=
            "<label for='metodo-pago'>Método de pago</label>" +
            "<select id='metodo-pago' aria-label='Método de pago'>" +
            "<option value=''>Selecciona una opción</option>" +
            "<option value='efectivo'>Efectivo</option>" +
            "<option value='tarjeta'>Tarjeta</option>" +
            "</select>" +
            "<button class='boton' onclick='comprar()'>Comprar</button>";
    }

    caja.innerHTML = texto;
}

function editarProducto(indice) {
    productoEditando = indice;
    renderizarCarrito();
}

function cancelarEdicion() {
    productoEditando = null;
    renderizarCarrito();
}

function guardarEdicion(indice) {
    let topping1 = document.getElementById("editar-topping1-" + indice).value;
    let topping2 = document.getElementById("editar-topping2-" + indice).value;
    let extra = document.getElementById("editar-extra-" + indice).value;

    carrito[indice].toppings = topping1 + ", " + topping2;
    carrito[indice].extra = extra;
    carrito[indice].precio = extra === "Ninguno" ? 1200 : 1400;
    guardarCarrito();
    productoEditando = null;
    renderizarCarrito();
}

function eliminarProducto(indice) {
    carrito.splice(indice, 1);
    guardarCarrito();
    productoEditando = null;
    actualizarCantidad();
    renderizarCarrito();
}

function comprar() {
    if (!obtenerCuentaSesion()) {
        if (!carrito.length) {
            alert("Agrega una chicha al carrito antes de comprar.");
            return;
        }
        if (!guardarCarrito()) {
            alert("No se pudo guardar tu carrito. Inténtalo de nuevo antes de iniciar sesión.");
            return;
        }
        sessionStorage.setItem("chichacookContinueAfterLogin", "services-cart");
        alert("Para completar la compra debes iniciar sesión. Conservamos tu carrito.");
        window.location.href = "login.html";
        return;
    }

    let metodoPago = document.getElementById("metodo-pago");
    if (!metodoPago || !metodoPago.value) {
        alert("Selecciona efectivo o tarjeta para continuar con la compra.");
        if (metodoPago) metodoPago.focus();
        return;
    }

    let cuentasCompra = obtenerCuentas();
    let usuarioSesion = sessionStorage.getItem("chichacookSession");
    let cuentaCompra = cuentasCompra.find(function(cuenta) {
        return normalizarIdentificador(cuenta.username) === normalizarIdentificador(usuarioSesion);
    });
    let indiceToppingGratis = cuentaCompra && cuentaCompra.toppingGratisDisponible
        ? carrito.findIndex(function(producto) { return producto.extra !== "Ninguno"; })
        : -1;
    let totalCompra = carrito.reduce(function(total, producto, indice) {
        return total + producto.precio - (indice === indiceToppingGratis ? 200 : 0);
    }, 0);
    let pagoConfirmado = metodoPago.value === "efectivo" ? "efectivo" : "tarjeta";
    alert("¡Pedido realizado correctamente! Total: $" + totalCompra.toLocaleString("es-CL") +
        ". Método de pago: " + pagoConfirmado + ".");

    if (indiceToppingGratis >= 0 && cuentaCompra) {
        cuentaCompra.toppingGratisDisponible = false;
        guardarCuentas(cuentasCompra);
    }

    carrito = [];
    guardarCarrito();
    productoEditando = null;

    actualizarCantidad();

    document.querySelectorAll("#carrito").forEach(function(elemento) {
        elemento.classList.remove("mostrar");
        elemento.innerHTML = "";
    });
}

function enviar(evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombre").value;

    alert("Gracias " + nombre + ", recibimos tu mensaje.");
}

function obtenerCuentas() {
    let cuentas = [];
    let cuentasTemporales = [];
    try {
        let guardadas = JSON.parse(localStorage.getItem("chichacookUsers") || "[]");
        if (Array.isArray(guardadas)) cuentas = guardadas;
    } catch (error) {
    }
    try {
        let temporales = JSON.parse(sessionStorage.getItem("chichacookUsersSession") || "[]");
        if (Array.isArray(temporales)) cuentasTemporales = temporales;
    } catch (error) {
    }

    cuentas = cuentas.filter(function(cuenta) {
        return cuenta && typeof cuenta === "object" && !Array.isArray(cuenta);
    });
    cuentasTemporales.filter(function(cuenta) {
        return cuenta && typeof cuenta === "object" && !Array.isArray(cuenta);
    }).forEach(function(cuentaTemporal) {
        let indice = cuentas.findIndex(function(cuenta) {
            return normalizarIdentificador(cuenta.username) === normalizarIdentificador(cuentaTemporal.username) ||
                (normalizarIdentificador(cuenta.email) &&
                    normalizarIdentificador(cuenta.email) === normalizarIdentificador(cuentaTemporal.email));
        });
        if (indice < 0) cuentas.push(cuentaTemporal);
        else cuentas[indice] = cuentaTemporal;
    });

    try {
        let cuentaAnterior = JSON.parse(localStorage.getItem("chichacookUser") || "null");
        if (cuentaAnterior && typeof cuentaAnterior === "object" && normalizarIdentificador(cuentaAnterior.username) &&
            !cuentas.some(function(cuenta) {
                return normalizarIdentificador(cuenta.username) === normalizarIdentificador(cuentaAnterior.username);
            })) {
            cuentas.push(cuentaAnterior);
        }
        if (cuentasTemporales.length || cuentaAnterior) {
            localStorage.setItem("chichacookUsers", JSON.stringify(cuentas));
            localStorage.removeItem("chichacookUser");
            sessionStorage.removeItem("chichacookUsersSession");
        }
    } catch (error) {
    }

    return cuentas;
}

function guardarCuentas(cuentas) {
    localStorage.setItem("chichacookUsers", JSON.stringify(cuentas));
}

function normalizarIdentificador(valor) {
    return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function obtenerCuentaSesion() {
    let usuarioSesion = sessionStorage.getItem("chichacookSession");
    if (!usuarioSesion) return null;

    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(elemento) {
        return normalizarIdentificador(elemento.username) === normalizarIdentificador(usuarioSesion);
    }) || null;
    if (!cuenta) return null;

    return cuenta;
}

function puntosCuenta(cuenta) {
    return Number.isSafeInteger(cuenta.puntos) && cuenta.puntos >= 0 ? cuenta.puntos : 0;
}

function cambiarPuntosSesion(cambio) {
    let usuarioSesion = sessionStorage.getItem("chichacookSession");
    if (!usuarioSesion) return null;

    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(elemento) {
        return normalizarIdentificador(elemento.username) === normalizarIdentificador(usuarioSesion);
    });
    if (!cuenta) return null;

    let nuevoSaldo = puntosCuenta(cuenta) + cambio;
    if (!Number.isSafeInteger(nuevoSaldo) || nuevoSaldo < 0) return null;
    cuenta.puntos = nuevoSaldo;
    guardarCuentas(cuentas);
    document.querySelectorAll("#blackjack-points, #roulette-points, #reward-points, #topping-reward-points").forEach(function(elemento) {
        elemento.textContent = cuenta.puntos.toLocaleString("es-CL");
    });
    document.querySelectorAll(".session-points").forEach(function(elemento) {
        elemento.textContent = "Puntos: " + cuenta.puntos.toLocaleString("es-CL");
        elemento.setAttribute("aria-label", cuenta.puntos.toLocaleString("es-CL") + " puntos disponibles");
    });
    return cuenta.puntos;
}

function actualizarNavegacionSesion() {
    let usuario = sessionStorage.getItem("chichacookSession");
    if (!usuario) return;
    let cuenta = obtenerCuentaSesion();

    document.querySelectorAll(".account-nav").forEach(function(navegacion) {
        navegacion.replaceChildren();

        let saludo = document.createElement("span");
        saludo.className = "session-user";
        saludo.textContent = "Hola, " + usuario;

        let puntos = document.createElement("span");
        puntos.className = "session-points";
        puntos.textContent = "Puntos: " + (cuenta ? puntosCuenta(cuenta) : 0).toLocaleString("es-CL");
        puntos.setAttribute("aria-label", (cuenta ? puntosCuenta(cuenta) : 0).toLocaleString("es-CL") + " puntos disponibles");

        let botonCerrar = document.createElement("button");
        botonCerrar.className = "logout-button";
        botonCerrar.type = "button";
        botonCerrar.textContent = "Cerrar sesión";
        botonCerrar.addEventListener("click", cerrarSesion);

        navegacion.append(saludo, puntos, botonCerrar);
    });
}

function cerrarSesion() {
    sessionStorage.removeItem("chichacookSession");
    window.location.href = "index.html";
}

function iniciarBlackjack() {
    let mesa = document.querySelector(".blackjack-section");
    if (!mesa) return;

    let palos = [
        { simbolo: "♠", nombre: "picas", rojo: false },
        { simbolo: "♥", nombre: "corazones", rojo: true },
        { simbolo: "♦", nombre: "diamantes", rojo: true },
        { simbolo: "♣", nombre: "tréboles", rojo: false }
    ];
    let valores = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let mazo = [];
    let manoJugador = [];
    let manoCasa = [];
    let partidaActiva = false;
    let victorias = 0;
    let derrotas = 0;
    let cartasJugador = document.getElementById("player-cards");
    let cartasCasa = document.getElementById("dealer-cards");
    let totalJugador = document.getElementById("player-total");
    let totalCasa = document.getElementById("dealer-total");
    let mensaje = document.getElementById("blackjack-message");
    let botonPedir = document.getElementById("blackjack-hit");
    let botonPlantarse = document.getElementById("blackjack-stand");
    let botonNueva = document.getElementById("blackjack-new");
    let apuestaInput = document.getElementById("blackjack-bet");
    let puntosJugador = document.getElementById("blackjack-points");
    let apuestaActual = 0;
    let apuestaLiquidada = false;
    let repartiendo = false;
    let numeroPartida = 0;
    let faseJuego = "idle";
    let indiceReparto = 0;
    let usuarioPartida = sessionStorage.getItem("chichacookSession");
    let clavePartida = usuarioPartida
        ? "chichacookBlackjack:" + normalizarIdentificador(usuarioPartida)
        : null;

    function guardarPartidaBlackjack() {
        if (!clavePartida) return false;
        try {
            if (apuestaActual <= 0 || apuestaLiquidada) {
                sessionStorage.removeItem(clavePartida);
                return true;
            }
            sessionStorage.setItem(clavePartida, JSON.stringify({
                mazo,
                manoJugador,
                manoCasa,
                apuestaActual,
                victorias,
                derrotas,
                faseJuego,
                indiceReparto
            }));
            return true;
        } catch (error) {
            return false;
        }
    }

    function leerPartidaBlackjack() {
        if (!clavePartida) return null;
        try {
            let partida = JSON.parse(sessionStorage.getItem(clavePartida) || "null");
            let cartaValida = function(carta) {
                return carta && valores.includes(carta.valor) && carta.palo &&
                    palos.some(function(palo) {
                        return palo.simbolo === carta.palo.simbolo && palo.nombre === carta.palo.nombre &&
                            palo.rojo === carta.palo.rojo;
                    });
            };
            if (!partida || !Array.isArray(partida.mazo) || !partida.mazo.every(cartaValida) ||
                !Array.isArray(partida.manoJugador) || !partida.manoJugador.every(cartaValida) ||
                !Array.isArray(partida.manoCasa) || !partida.manoCasa.every(cartaValida) ||
                !Number.isSafeInteger(partida.apuestaActual) || partida.apuestaActual <= 0 ||
                !Number.isSafeInteger(partida.victorias) || !Number.isSafeInteger(partida.derrotas) ||
                !["initial-deal", "player", "dealer"].includes(partida.faseJuego) ||
                !Number.isInteger(partida.indiceReparto) || partida.indiceReparto < 0 || partida.indiceReparto > 4) {
                sessionStorage.removeItem(clavePartida);
                return null;
            }
            return partida;
        } catch (error) {
            try {
                sessionStorage.removeItem(clavePartida);
            } catch (errorAlmacenamiento) {
            }
            return null;
        }
    }

    function borrarPartidaBlackjack() {
        if (!clavePartida) return;
        try {
            sessionStorage.removeItem(clavePartida);
        } catch (error) {
        }
    }

    function barajarMazo() {
        mazo = [];
        palos.forEach(function(palo) {
            valores.forEach(function(valor) {
                mazo.push({ valor: valor, palo: palo });
            });
        });

        for (let indice = mazo.length - 1; indice > 0; indice--) {
            let aleatorio = Math.floor(Math.random() * (indice + 1));
            [mazo[indice], mazo[aleatorio]] = [mazo[aleatorio], mazo[indice]];
        }
    }

    function tomarCarta() {
        return mazo.pop();
    }

    function esperar(ms) {
        return new Promise(function(resolve) {
            window.setTimeout(resolve, ms);
        });
    }

    function calcularPuntos(mano) {
        let puntos = 0;
        let ases = 0;
        mano.forEach(function(carta) {
            if (carta.valor === "A") {
                puntos += 11;
                ases++;
            } else if (["J", "Q", "K"].includes(carta.valor)) {
                puntos += 10;
            } else {
                puntos += Number(carta.valor);
            }
        });

        while (puntos > 21 && ases > 0) {
            puntos -= 10;
            ases--;
        }
        return puntos;
    }

    function crearCarta(carta, oculta, animar) {
        let elementoCarta = document.createElement("div");
        elementoCarta.className = "playing-card" + (animar ? " is-dealing" : "");
        if (oculta) {
            elementoCarta.classList.add("is-hidden");
            elementoCarta.setAttribute("aria-label", "Carta oculta");
            elementoCarta.textContent = "★";
        } else {
            if (carta.palo.rojo) elementoCarta.classList.add("is-red");
            elementoCarta.setAttribute("aria-label", carta.valor + " de " + carta.palo.nombre);

            let esquina = document.createElement("span");
            esquina.className = "card-corner";
            esquina.textContent = carta.valor;
            let palo = document.createElement("span");
            palo.className = "card-suit";
            palo.setAttribute("aria-hidden", "true");
            palo.textContent = carta.palo.simbolo;
            elementoCarta.append(esquina, palo);
        }
        return elementoCarta;
    }

    function agregarCarta(elemento, carta, oculta) {
        elemento.append(crearCarta(carta, oculta, true));
    }

    function mostrarMano(elemento, mano, ocultarSegunda) {
        while (elemento.children.length < mano.length) {
            let indice = elemento.children.length;
            agregarCarta(elemento, mano[indice], ocultarSegunda && indice === 1);
        }

        if (!ocultarSegunda) {
            let cartaOculta = elemento.querySelector(".is-hidden");
            if (cartaOculta) {
                let cartaRevelada = crearCarta(mano[1], false, false);
                cartaRevelada.classList.add("is-revealing");
                cartaOculta.replaceWith(cartaRevelada);
            }
        }
    }

    function actualizarMesa(revelarCasa) {
        mostrarMano(cartasJugador, manoJugador, false);
        mostrarMano(cartasCasa, manoCasa, !revelarCasa);
        totalJugador.textContent = "Puntos: " + calcularPuntos(manoJugador);
        totalCasa.textContent = "Puntos: " + (revelarCasa
            ? calcularPuntos(manoCasa)
            : calcularPuntos(manoCasa.slice(0, 1)) + " + ?");
        botonPedir.disabled = !partidaActiva;
        botonPlantarse.disabled = !partidaActiva;
        botonNueva.disabled = partidaActiva || repartiendo;
        apuestaInput.disabled = partidaActiva || repartiendo;
        let cuenta = obtenerCuentaSesion();
        puntosJugador.textContent = cuenta
            ? puntosCuenta(cuenta).toLocaleString("es-CL")
            : "Inicia sesión";
        document.getElementById("blackjack-wins").textContent = victorias;
        document.getElementById("blackjack-losses").textContent = derrotas;
        guardarPartidaBlackjack();
    }

    function obtenerRepartoInicial() {
        return [
            { mano: manoJugador, tablero: cartasJugador, oculta: false },
            { mano: manoCasa, tablero: cartasCasa, oculta: false },
            { mano: manoJugador, tablero: cartasJugador, oculta: false },
            { mano: manoCasa, tablero: cartasCasa, oculta: true }
        ];
    }

    function finalizarRepartoInicial() {
        repartiendo = false;
        partidaActiva = true;
        faseJuego = "player";
        let blackjackJugador = calcularPuntos(manoJugador) === 21;
        let blackjackCasa = calcularPuntos(manoCasa) === 21;
        if (blackjackJugador || blackjackCasa) {
            partidaActiva = false;
            actualizarMesa(true);
            if (blackjackJugador && blackjackCasa) {
                liquidarApuesta("tie");
                mostrarResultadoJuego("tie", 0);
                mostrarMensaje("¡Blackjack para ambos! Empate; se devuelve tu apuesta.", "tie");
            } else if (blackjackJugador) {
                victorias++;
                liquidarApuesta("win");
                mostrarResultadoJuego("win", apuestaActual);
                mostrarMensaje("¡Blackjack! Ganaste y recibes " +
                    (apuestaActual * 2).toLocaleString("es-CL") + " puntos.", "win");
            } else {
                derrotas++;
                liquidarApuesta("loss");
                mostrarResultadoJuego("loss", apuestaActual);
                mostrarMensaje("La casa tiene blackjack. Pierdes " +
                    apuestaActual.toLocaleString("es-CL") + " puntos.", "loss");
            }
        } else {
            mostrarMensaje("Tu turno: pide una carta o plántate.", "");
        }
        actualizarMesa(!partidaActiva);
    }

    async function repartirManoInicial(partida, desdeIndice) {
        let reparto = obtenerRepartoInicial();
        for (let indice = desdeIndice; indice < reparto.length; indice++) {
            await esperar(360);
            if (partida !== numeroPartida) return;
            let turno = reparto[indice];
            let carta = tomarCarta();
            turno.mano.push(carta);
            indiceReparto = indice + 1;
            agregarCarta(turno.tablero, carta, turno.oculta);
            actualizarMesa(false);
        }
        finalizarRepartoInicial();
    }

    function restaurarPartidaBlackjack() {
        let partidaGuardada = leerPartidaBlackjack();
        if (!partidaGuardada) return false;

        mazo = partidaGuardada.mazo;
        manoJugador = partidaGuardada.manoJugador;
        manoCasa = partidaGuardada.manoCasa;
        apuestaActual = partidaGuardada.apuestaActual;
        apuestaLiquidada = false;
        victorias = partidaGuardada.victorias;
        derrotas = partidaGuardada.derrotas;
        faseJuego = partidaGuardada.faseJuego;
        indiceReparto = partidaGuardada.indiceReparto;
        numeroPartida++;
        partidaActiva = false;
        repartiendo = false;
        apuestaInput.value = String(apuestaActual);
        cartasJugador.replaceChildren();
        cartasCasa.replaceChildren();
        actualizarMesa(faseJuego === "dealer");

        if (faseJuego === "initial-deal") {
            let reparto = obtenerRepartoInicial();
            while (indiceReparto < reparto.length) {
                let turno = reparto[indiceReparto];
                turno.mano.push(tomarCarta());
                indiceReparto++;
            }
            finalizarRepartoInicial();
        } else if (faseJuego === "dealer") {
            partidaActiva = true;
            terminarMano();
        } else {
            partidaActiva = true;
            if (calcularPuntos(manoJugador) >= 21) {
                terminarMano();
            } else {
                mostrarMensaje("Partida recuperada. Tu turno: pide una carta o plántate.", "");
                actualizarMesa(false);
            }
        }
        return true;
    }

    function liquidarApuesta(resultado) {
        if (apuestaLiquidada) return;
        apuestaLiquidada = true;

        let devolucion = resultado === "win" ? apuestaActual * 2 : resultado === "tie" ? apuestaActual : 0;
        if (devolucion > 0) cambiarPuntosSesion(devolucion);
        borrarPartidaBlackjack();
    }

    function mostrarMensaje(texto, resultado) {
        mensaje.classList.remove("is-win", "is-loss", "is-tie", "message-pop");
        mensaje.textContent = texto;
        if (resultado) mensaje.classList.add("is-" + resultado);
        void mensaje.offsetWidth;
        mensaje.classList.add("message-pop");
    }

    async function terminarMano() {
        if (!partidaActiva || repartiendo) return;
        partidaActiva = false;
        repartiendo = true;
        faseJuego = "dealer";
        actualizarMesa(true);
        mostrarMensaje("La casa revela su carta...", "");
        await esperar(450);

        let puntosJugador = calcularPuntos(manoJugador);
        let puntosCasa = calcularPuntos(manoCasa);
        if (puntosJugador <= 21) {
            while (puntosCasa < 17) {
                mostrarMensaje("La casa pide una carta...", "");
                await esperar(350);
                let carta = tomarCarta();
                manoCasa.push(carta);
                mostrarMano(cartasCasa, manoCasa, false);
                puntosCasa = calcularPuntos(manoCasa);
                actualizarMesa(true);
                await esperar(400);
            }
        }

        repartiendo = false;
        if (puntosJugador > 21) {
            derrotas++;
            liquidarApuesta("loss");
            mostrarResultadoJuego("loss", apuestaActual);
            mostrarMensaje("¡Te pasaste de 21! Gana la casa. Perdiste " +
                apuestaActual.toLocaleString("es-CL") + " puntos.", "loss");
        } else if (puntosCasa > 21 || puntosJugador > puntosCasa) {
            victorias++;
            liquidarApuesta("win");
            mostrarResultadoJuego("win", apuestaActual);
            mostrarMensaje((puntosCasa > 21
                ? "¡La casa se pasó de 21! ¡Ganaste!"
                : "¡Ganaste con " + puntosJugador + " puntos!") +
                " Recibes " + (apuestaActual * 2).toLocaleString("es-CL") + " puntos.", "win");
        } else if (puntosJugador < puntosCasa) {
            derrotas++;
            liquidarApuesta("loss");
            mostrarResultadoJuego("loss", apuestaActual);
            mostrarMensaje("La casa tiene " + puntosCasa + ". Pierdes " +
                apuestaActual.toLocaleString("es-CL") + " puntos.", "loss");
        } else {
            liquidarApuesta("tie");
            mostrarResultadoJuego("tie", 0);
            mostrarMensaje("Empate con " + puntosJugador + " puntos. Se devuelve tu apuesta de " +
                apuestaActual.toLocaleString("es-CL") + ".", "tie");
        }
        actualizarMesa(true);
    }

    async function nuevaPartida() {
        if (repartiendo) return;
        let cuenta = obtenerCuentaSesion();
        if (!cuenta) {
            actualizarMesa(false);
            mostrarMensaje("Inicia sesión para recibir tus puntos y jugar con apuestas.", "tie");
            return;
        }
        let cantidadApuesta = Number(apuestaInput.value);
        if (!Number.isSafeInteger(cantidadApuesta) || cantidadApuesta <= 0) {
            mostrarMensaje("Escribe una apuesta válida en puntos (mínimo 1).", "loss");
            apuestaInput.focus();
            return;
        }
        if (cantidadApuesta > Number.MAX_SAFE_INTEGER - puntosCuenta(cuenta)) {
            mostrarMensaje("La apuesta es demasiado alta para el saldo máximo permitido.", "loss");
            apuestaInput.focus();
            return;
        }
        if (cantidadApuesta > puntosCuenta(cuenta)) {
            mostrarMensaje("No tienes suficientes puntos para esa apuesta. Tu saldo es " +
                puntosCuenta(cuenta).toLocaleString("es-CL") + ".", "loss");
            apuestaInput.focus();
            return;
        }
        let nuevoSaldo = cambiarPuntosSesion(-cantidadApuesta);
        if (nuevoSaldo === null) {
            mostrarMensaje("No se pudo registrar la apuesta. Vuelve a iniciar sesión.", "loss");
            return;
        }

        let partida = ++numeroPartida;
        apuestaActual = cantidadApuesta;
        apuestaLiquidada = false;
        repartiendo = true;
        partidaActiva = false;
        faseJuego = "initial-deal";
        indiceReparto = 0;
        barajarMazo();
        manoJugador = [];
        manoCasa = [];
        cartasJugador.replaceChildren();
        cartasCasa.replaceChildren();
        actualizarMesa(false);
        if (!guardarPartidaBlackjack()) {
            cambiarPuntosSesion(cantidadApuesta);
            apuestaLiquidada = true;
            repartiendo = false;
            faseJuego = "idle";
            borrarPartidaBlackjack();
            actualizarMesa(false);
            mostrarMensaje("No se pudo guardar la partida. Se devolvió tu apuesta; inténtalo de nuevo.", "loss");
            return;
        }
        mostrarMensaje("Apuesta de " + apuestaActual.toLocaleString("es-CL") +
            " puntos realizada. Barajando y repartiendo...", "");

        await repartirManoInicial(partida, 0);
    }

    botonPedir.addEventListener("click", function() {
        if (!partidaActiva || repartiendo) return;
        repartiendo = true;
        partidaActiva = false;
        let carta = tomarCarta();
        manoJugador.push(carta);
        faseJuego = "player";
        actualizarMesa(false);
        mostrarMensaje("¡Carta repartida! " + carta.valor + carta.palo.simbolo + " para ti.", "");

        window.setTimeout(function() {
            repartiendo = false;
            partidaActiva = true;
            actualizarMesa(false);
            let puntos = calcularPuntos(manoJugador);
            if (puntos >= 21) {
                if (puntos === 21) mostrarMensaje("¡21 puntos! Ahora juega la casa.", "");
                terminarMano();
            } else {
                mostrarMensaje("Tienes " + puntos + " puntos. ¿Pides otra o te plantas?", "");
            }
        }, 500);
    });

    botonPlantarse.addEventListener("click", function() {
        if (partidaActiva && !repartiendo) terminarMano();
    });

    botonNueva.addEventListener("click", nuevaPartida);
    if (!restaurarPartidaBlackjack()) {
        actualizarMesa(false);
        mostrarMensaje("Elige tu apuesta y pulsa «Nueva partida» para repartir.", "");
    }
}

function iniciarRuleta() {
    let tablero = document.getElementById("roulette-board");
    if (!tablero) return;

    let numerosRojos = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    let ordenRuleta = ["0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22", "34", "15", "3", "24", "36", "13", "1", "00", "27", "10", "25", "29", "12", "8", "19", "31", "18", "6", "21", "33", "16", "4", "23", "35", "14", "2"];
    let duracionVueltaRuleta = 90000;
    let opciones = Array.from(document.querySelectorAll(".roulette-bet-choice"));
    let fichasRapidas = Array.from(document.querySelectorAll(".roulette-chip-choice"));
    let apuestaInput = document.getElementById("roulette-bet");
    let botonAgregarApuesta = document.getElementById("roulette-add-bet");
    let botonDeshacerApuesta = document.getElementById("roulette-undo-bet");
    let botonApuestaMaxima = document.getElementById("roulette-max-bet");
    let botonLimpiarApuestas = document.getElementById("roulette-clear-bets");
    let rueda = document.getElementById("roulette-wheel");
    let aroRuleta = document.getElementById("roulette-wheel-ring");
    let pistaPelota = rueda.querySelector(".roulette-ball-track");
    let resultadoElemento = document.getElementById("roulette-result");
    let mensaje = document.getElementById("roulette-message");
    let cuentaAtras = document.getElementById("roulette-countdown");
    let seleccion = document.getElementById("roulette-selection");
    let listaApuestas = document.getElementById("roulette-pending-list");
    let contadorApuestas = document.getElementById("roulette-bet-count");
    let totalApuestaTexto = document.getElementById("roulette-total-bet");
    let botonesCasilla = [];
    let etiquetasRueda = [];
    let apuestasPendientes = [];
    let tipoApuesta = "number";
    let numeroElegido = "0";
    let importeRapido = null;
    let girando = false;
    let temporizadorApuesta = null;
    let finCuentaAtras = 0;
    let audioContext = null;
    let sonidoActivo = false;
    let usuarioApuestas = sessionStorage.getItem("chichacookSession");
    let claveApuestasPendientes = usuarioApuestas
        ? "chichacookRouletteBets:" + normalizarIdentificador(usuarioApuestas)
        : null;
    let claveGiroRuleta = usuarioApuestas
        ? "chichacookRouletteRound:" + normalizarIdentificador(usuarioApuestas)
        : null;

    function colorNumero(numero) {
        if (numero === "0" || numero === "00") return "green";
        return numerosRojos.has(Number(numero)) ? "red" : "black";
    }

    function numeroIncluido(numero, tipo, numeroApostado) {
        let valor = numero === "00" ? 0 : Number(numero);
        if (tipo === "number") return numero === numeroApostado;
        if (tipo === "red" || tipo === "black") return colorNumero(numero) === tipo;
        if (valor === 0) return false;
        if (tipo === "even") return valor % 2 === 0;
        if (tipo === "odd") return valor % 2 === 1;
        if (tipo === "low") return valor <= 18;
        if (tipo === "high") return valor >= 19;
        if (tipo.indexOf("dozen-") === 0) {
            let docena = Number(tipo.slice(-1));
            return valor >= (docena - 1) * 12 + 1 && valor <= docena * 12;
        }
        if (tipo.indexOf("column-") === 0) {
            return valor % 3 === Number(tipo.slice(-1)) % 3;
        }
        return false;
    }

    function multiplicadorApuesta(tipo) {
        if (tipo === "number") return 36;
        if (tipo.indexOf("dozen-") === 0 || tipo.indexOf("column-") === 0) return 3;
        return 2;
    }

    function agregarApuesta(importe) {
        let cuenta = obtenerCuentaSesion();
        if (!cuenta) {
            mostrarMensaje("Inicia sesión para preparar apuestas.", "loss");
            return false;
        }

        let total = totalApostado();
        if (!Number.isSafeInteger(importe) || importe <= 0 || !Number.isSafeInteger(total + importe)) {
            mostrarMensaje("Ingresa un importe válido para esta apuesta.", "loss");
            return false;
        }
        if (total + importe > puntosCuenta(cuenta)) {
            mostrarMensaje("El total supera tu saldo disponible.", "loss");
            return false;
        }

        apuestasPendientes.push({ tipo: tipoApuesta, numero: numeroElegido, importe: importe });
        actualizarApuestas();
        mostrarMensaje("Apuesta añadida: " +
            descripcionApuesta(apuestasPendientes[apuestasPendientes.length - 1]) + ".", "");
        iniciarCuentaAtras();
        return true;
    }

    function desactivarApuestaRapida() {
        importeRapido = null;
        fichasRapidas.forEach(function(ficha) {
            ficha.setAttribute("aria-pressed", "false");
        });
    }

    function crearCasilla(numero, claseColor, columna, fila, filasOcupadas) {
        let boton = document.createElement("button");
        boton.type = "button";
        boton.className = "roulette-number is-" + claseColor;
        boton.textContent = numero;
        boton.dataset.number = numero;
        boton.setAttribute("aria-label", numero === "00" ? "Doble cero, verde" : "Número " + numero + ", " + claseColor);
        boton.style.gridColumn = String(columna);
        boton.style.gridRow = fila + (filasOcupadas > 1 ? " / span " + filasOcupadas : "");
        boton.addEventListener("click", function() {
            numeroElegido = boton.dataset.number;
            tipoApuesta = "number";
            actualizarSeleccion();
            if (importeRapido !== null) agregarApuesta(importeRapido);
        });
        tablero.append(boton);
        botonesCasilla.push(boton);
    }

    function actualizarSeleccion() {
        opciones.forEach(function(opcion) {
            let activa = opcion.dataset.betType === tipoApuesta;
            opcion.classList.toggle("is-selected", activa);
            opcion.setAttribute("aria-pressed", String(activa));
        });
        botonesCasilla.forEach(function(boton) {
            boton.classList.toggle("is-selected", numeroIncluido(boton.dataset.number, tipoApuesta, numeroElegido));
        });

        if (tipoApuesta === "number") {
            seleccion.textContent = "Apuesta al número " + numeroElegido + " (paga 35 a 1).";
        } else if (tipoApuesta.indexOf("dozen-") === 0) {
            seleccion.textContent = "Apuesta a la docena " + tipoApuesta.slice(-1) + " (paga 2 a 1).";
        } else if (tipoApuesta.indexOf("column-") === 0) {
            seleccion.textContent = "Apuesta a la columna " + tipoApuesta.slice(-1) + " (paga 2 a 1).";
        } else {
            let descripciones = {
                red: "el rojo", black: "el negro", even: "los pares", odd: "los impares",
                low: "1 al 18", high: "19 al 36"
            };
            seleccion.textContent = "Apuesta a " + descripciones[tipoApuesta] + " (paga 1 a 1).";
        }
    }

    function mostrarMensaje(texto, resultado) {
        mensaje.classList.remove("is-win", "is-loss");
        mensaje.classList.add("is-" + resultado);
        mensaje.textContent = texto;
    }

    function actualizarSaldo() {
        let cuenta = obtenerCuentaSesion();
        let saldo = cuenta ? puntosCuenta(cuenta) : 0;
        document.getElementById("roulette-points").textContent = cuenta
            ? saldo.toLocaleString("es-CL")
            : "Inicia sesión";
        apuestaInput.max = String(saldo);
    }

    function finalizarGiroRuleta(giro, recuperado) {
        let numero = String(giro.numero);
        let indiceResultado = ordenRuleta.indexOf(numero);
        if (indiceResultado < 0) return;
        let apuestasDelGiro = giro.apuestas;
        let cantidadApuesta = giro.cantidadApuesta;
        let color = colorNumero(numero);
        let apuestasGanadoras = apuestasDelGiro.filter(function(apuesta) {
            return numeroIncluido(numero, apuesta.tipo, apuesta.numero);
        });
        let premio = apuestasGanadoras.reduce(function(total, apuesta) {
            return total + apuesta.importe * multiplicadorApuesta(apuesta.tipo);
        }, 0);
        let importeGanador = apuestasGanadoras.reduce(function(total, apuesta) {
            return total + apuesta.importe;
        }, 0);
        let gradosPorCasilla = 360 / ordenRuleta.length;
        let anguloCentroResultado = indiceResultado * gradosPorCasilla + gradosPorCasilla / 2;

        resultadoElemento.textContent = numero;
        let ruedaAlineada = -anguloCentroResultado;
        aroRuleta.style.transform = "rotate(" + ruedaAlineada + "deg)";
        etiquetasRueda.forEach(function(etiqueta) {
            etiqueta.style.transform = "rotate(" + -ruedaAlineada + "deg)";
        });
        aroRuleta.classList.remove("is-idle");
        pistaPelota.classList.remove("is-spinning");
        pistaPelota.classList.add("is-revealed", "is-landed");
        pistaPelota.style.transform = "rotate(0deg)";
        rueda.setAttribute("aria-label", "Ruleta americana: salió " + numero + " " + color);

        if (premio > 0) {
            let saldo = cambiarPuntosSesion(premio);
            if (saldo === null) {
                mostrarResultadoJuego("loss", cantidadApuesta);
                mostrarMensaje("Salió " + numero + " " + color + ". No se pudo abonar el premio.", "loss");
            } else {
                let gananciaNeta = premio - cantidadApuesta;
                let resultadoNeto = gananciaNeta > 0
                    ? "win"
                    : gananciaNeta < 0
                        ? "loss"
                        : "tie";
                if (gananciaNeta > 0) {
                    mostrarResultadoJuego("win", gananciaNeta);
                } else if (gananciaNeta < 0) {
                    mostrarResultadoJuego("loss", Math.abs(gananciaNeta));
                } else {
                    mostrarResultadoJuego("tie", 0);
                }
                mostrarMensaje((recuperado ? "Giro recuperado. " : "") + "Salió " + numero + " " + color +
                    ": premio total " + premio.toLocaleString("es-CL") +
                    " puntos (incluye " + importeGanador.toLocaleString("es-CL") +
                    " de apuestas devueltas; ganancia neta " + gananciaNeta.toLocaleString("es-CL") + ").", "win");
                mensaje.classList.remove("is-win", "is-loss");
                if (resultadoNeto !== "tie") mensaje.classList.add("is-" + resultadoNeto);
            }
        } else {
            mostrarResultadoJuego("loss", cantidadApuesta);
            mostrarMensaje((recuperado ? "Giro recuperado. " : "") + "Salió " + numero + " " + color +
                ". No hubo premio; perdiste " + cantidadApuesta.toLocaleString("es-CL") + " puntos.", "loss");
        }

        apuestasPendientes = [];
        guardarApuestasPendientes();
        borrarGiroRuleta();
        girando = false;
        cambiarEstadoControles(false);
        actualizarApuestas();
        actualizarSaldo();
        cancelarCuentaAtras();
    }

    function totalApostado() {
        return apuestasPendientes.reduce(function(total, apuesta) {
            return total + apuesta.importe;
        }, 0);
    }

    function guardarApuestasPendientes() {
        if (!claveApuestasPendientes) return;
        try {
            if (apuestasPendientes.length) {
                sessionStorage.setItem(claveApuestasPendientes, JSON.stringify(apuestasPendientes));
            } else {
                sessionStorage.removeItem(claveApuestasPendientes);
            }
        } catch (error) {
        }
    }

    function borrarApuestasPendientesGuardadas() {
        if (!claveApuestasPendientes) return true;
        try {
            sessionStorage.removeItem(claveApuestasPendientes);
            return sessionStorage.getItem(claveApuestasPendientes) === null;
        } catch (error) {
            return false;
        }
    }

    function guardarGiroRuleta(giro) {
        if (!claveGiroRuleta) return false;
        try {
            sessionStorage.setItem(claveGiroRuleta, JSON.stringify(giro));
            return true;
        } catch (error) {
            return false;
        }
    }

    function leerGiroRuleta() {
        if (!claveGiroRuleta) return null;
        try {
            let giro = JSON.parse(sessionStorage.getItem(claveGiroRuleta) || "null");
            let tiposApuestaValidos = [
                "red", "black", "even", "odd", "low", "high",
                "dozen-1", "dozen-2", "dozen-3", "column-1", "column-2", "column-3"
            ];
            if (!giro || !ordenRuleta.includes(String(giro.numero)) || !Array.isArray(giro.apuestas) ||
                !giro.apuestas.length || giro.apuestas.some(function(apuesta) {
                    return !apuesta || !Number.isSafeInteger(apuesta.importe) || apuesta.importe <= 0 ||
                        (apuesta.tipo === "number"
                            ? !ordenRuleta.includes(String(apuesta.numero))
                            : !tiposApuestaValidos.includes(apuesta.tipo));
                })) {
                sessionStorage.removeItem(claveGiroRuleta);
                return null;
            }
            let cantidadApuesta = giro.apuestas.reduce(function(total, apuesta) {
                return total + apuesta.importe;
            }, 0);
            let premioMaximo = giro.apuestas.reduce(function(total, apuesta) {
                return total + apuesta.importe * multiplicadorApuesta(apuesta.tipo);
            }, 0);
            if (!Number.isSafeInteger(cantidadApuesta) || !Number.isSafeInteger(premioMaximo)) {
                sessionStorage.removeItem(claveGiroRuleta);
                return null;
            }
            return {
                numero: String(giro.numero),
                apuestas: giro.apuestas.map(function(apuesta) {
                    return {
                        tipo: apuesta.tipo,
                        numero: apuesta.tipo === "number" ? String(apuesta.numero) : "0",
                        importe: apuesta.importe
                    };
                }),
                cantidadApuesta
            };
        } catch (error) {
            try {
                sessionStorage.removeItem(claveGiroRuleta);
            } catch (errorAlmacenamiento) {
            }
            return null;
        }
    }

    function borrarGiroRuleta() {
        if (!claveGiroRuleta) return;
        try {
            sessionStorage.removeItem(claveGiroRuleta);
        } catch (error) {
        }
    }

    function restaurarApuestasPendientes() {
        if (!claveApuestasPendientes) return;
        try {
            let guardadas = JSON.parse(sessionStorage.getItem(claveApuestasPendientes) || "[]");
            if (!Array.isArray(guardadas)) throw new Error("Formato de apuestas no válido");

            let tiposApuestaValidos = [
                "red", "black", "even", "odd", "low", "high",
                "dozen-1", "dozen-2", "dozen-3", "column-1", "column-2", "column-3"
            ];
            apuestasPendientes = guardadas.filter(function(apuesta) {
                if (!apuesta || typeof apuesta !== "object" ||
                    !Number.isSafeInteger(apuesta.importe) || apuesta.importe <= 0) return false;
                if (apuesta.tipo === "number") return ordenRuleta.includes(String(apuesta.numero));
                return tiposApuestaValidos.includes(apuesta.tipo);
            }).map(function(apuesta) {
                return {
                    tipo: apuesta.tipo,
                    numero: apuesta.tipo === "number" ? String(apuesta.numero) : "0",
                    importe: apuesta.importe
                };
            });

            let cuenta = obtenerCuentaSesion();
            let total = totalApostado();
            if (!cuenta || !Number.isSafeInteger(total) || total > puntosCuenta(cuenta)) {
                apuestasPendientes = [];
            }
            guardarApuestasPendientes();
        } catch (error) {
            apuestasPendientes = [];
            try {
                sessionStorage.removeItem(claveApuestasPendientes);
            } catch (errorAlmacenamiento) {
            }
        }
    }

    function descripcionApuesta(apuesta) {
        if (apuesta.tipo === "number") return "Número " + apuesta.numero;
        if (apuesta.tipo.indexOf("dozen-") === 0) return "Docena " + apuesta.tipo.slice(-1);
        if (apuesta.tipo.indexOf("column-") === 0) return "Columna " + apuesta.tipo.slice(-1);
        let descripciones = {
            red: "Rojo", black: "Negro", even: "Par", odd: "Impar",
            low: "1-18", high: "19-36"
        };
        return descripciones[apuesta.tipo];
    }

    function actualizarApuestas() {
        guardarApuestasPendientes();
        listaApuestas.replaceChildren();
        let apuestasPorPosicion = new Map();
        document.querySelectorAll(".roulette-number, .roulette-bet-choice").forEach(function(boton) {
            boton.classList.remove("is-on-bet");
            boton.querySelectorAll(".roulette-chip").forEach(function(ficha) {
                ficha.remove();
            });
        });

        apuestasPendientes.forEach(function(apuesta) {
            let elemento = document.createElement("li");
            let nombre = document.createElement("span");
            let importe = document.createElement("strong");
            nombre.textContent = descripcionApuesta(apuesta);
            importe.textContent = apuesta.importe.toLocaleString("es-CL") + " pts";
            elemento.append(nombre, importe);
            listaApuestas.append(elemento);

            let boton = apuesta.tipo === "number"
                ? botonesCasilla.find(function(casilla) { return casilla.dataset.number === apuesta.numero; })
                : opciones.find(function(opcion) { return opcion.dataset.betType === apuesta.tipo; });
            if (boton) apuestasPorPosicion.set(boton, (apuestasPorPosicion.get(boton) || 0) + 1);
        });

        if (apuestasPendientes.length === 0) {
            let vacio = document.createElement("li");
            vacio.className = "is-empty";
            vacio.textContent = "Sin apuestas todavía.";
            listaApuestas.append(vacio);
        }
        listaApuestas.scrollTop = listaApuestas.scrollHeight;

        apuestasPorPosicion.forEach(function(cantidad, boton) {
            boton.classList.add("is-on-bet");
            let ficha = document.createElement("span");
            ficha.className = "roulette-chip";
            ficha.setAttribute("aria-hidden", "true");
            ficha.textContent = String(cantidad);
            boton.append(ficha);
        });

        let total = totalApostado();
        let cuenta = obtenerCuentaSesion();
        let restante = cuenta ? Math.max(0, puntosCuenta(cuenta) - total) : 0;
        contadorApuestas.textContent = "Apuestas preparadas: " + apuestasPendientes.length;
        totalApuestaTexto.textContent = "Total apostado: " + total.toLocaleString("es-CL") +
            " puntos · Saldo restante: " + restante.toLocaleString("es-CL");
        botonLimpiarApuestas.disabled = girando || apuestasPendientes.length === 0;
        botonAgregarApuesta.disabled = girando;
        botonDeshacerApuesta.disabled = girando || apuestasPendientes.length === 0;
        botonApuestaMaxima.disabled = girando || restante === 0;
        fichasRapidas.forEach(function(ficha) {
            ficha.disabled = girando;
        });
        apuestaInput.max = String(restante);
        if (apuestasPendientes.length === 0 && temporizadorApuesta !== null) {
            cancelarCuentaAtras();
        }
    }

    function cambiarEstadoControles(bloqueado) {
        apuestaInput.disabled = bloqueado;
        botonAgregarApuesta.disabled = bloqueado;
        botonDeshacerApuesta.disabled = bloqueado || apuestasPendientes.length === 0;
        botonApuestaMaxima.disabled = bloqueado || (obtenerCuentaSesion() &&
            puntosCuenta(obtenerCuentaSesion()) <= totalApostado());
        botonLimpiarApuestas.disabled = bloqueado || apuestasPendientes.length === 0;
        fichasRapidas.forEach(function(ficha) {
            ficha.disabled = bloqueado;
        });
        opciones.forEach(function(opcion) {
            opcion.disabled = bloqueado;
        });
        botonesCasilla.forEach(function(boton) {
            boton.disabled = bloqueado;
        });
        if (!bloqueado) actualizarApuestas();
    }

    createRouletteBoard();
    crearRueda();

    function createRouletteBoard() {
        crearCasilla("0", "green", 1, 1, 2);
        crearCasilla("00", "green", 1, 3, 1);
        for (let numero = 1; numero <= 36; numero++) {
            let fila = 3 - ((numero - 1) % 3);
            let columna = Math.floor((numero - 1) / 3) + 2;
            crearCasilla(String(numero), colorNumero(String(numero)), columna, fila, 1);
        }

        let posicionesApuesta = {
            "column-3": [14, 1], "column-2": [14, 2], "column-1": [14, 3],
            "dozen-1": [2, 4, 4], "dozen-2": [6, 4, 4], "dozen-3": [10, 4, 4],
            low: [2, 5, 2], even: [4, 5, 2], red: [6, 5, 2],
            black: [8, 5, 2], odd: [10, 5, 2], high: [12, 5, 2]
        };
        opciones.forEach(function(opcion) {
            let posicion = posicionesApuesta[opcion.dataset.betType];
            if (!posicion) return;
            opcion.style.gridColumn = String(posicion[0]) + (posicion[2] ? " / span " + posicion[2] : "");
            opcion.style.gridRow = String(posicion[1]);
        });
    }

    function crearRueda() {
        let gradosPorCasilla = 360 / ordenRuleta.length;
        let sectores = [];
        ordenRuleta.forEach(function(numero, indice) {
            let inicio = indice * gradosPorCasilla;
            let fin = (indice + 1) * gradosPorCasilla;
            let color = colorNumero(numero);
            let colorSector = color === "red" ? "#c51f35" : color === "green" ? "#16844f" : "#202020";
            let finSector = fin - 1.5;
            sectores.push(colorSector + " " + inicio + "deg " + finSector + "deg");
            sectores.push("#f2c94c " + finSector + "deg " + fin + "deg");

            let etiqueta = document.createElement("span");
            let textoEtiqueta = document.createElement("span");
            let angulo = inicio + gradosPorCasilla / 2;
            etiqueta.className = "roulette-wheel-number is-" + color;
            textoEtiqueta.className = "roulette-wheel-number-label";
            textoEtiqueta.textContent = numero;
            textoEtiqueta.style.transform = "rotate(0deg)";
            etiqueta.style.transform = "translate(-50%, -50%) rotate(" + angulo + "deg) translateY(calc(0px - var(--wheel-radius))) rotate(" + -angulo + "deg)";
            etiqueta.append(textoEtiqueta);
            aroRuleta.append(etiqueta);
            etiquetasRueda.push(textoEtiqueta);
        });
        aroRuleta.style.background = "conic-gradient(" + sectores.join(", ") + ")";
    }

    aroRuleta.classList.add("is-idle");

    function anguloActualRueda() {
        let transformacion = window.getComputedStyle(aroRuleta).transform;
        if (transformacion === "none") return 0;
        let matriz = new DOMMatrixReadOnly(transformacion);
        return (Math.atan2(matriz.b, matriz.a) * 180 / Math.PI + 360) % 360;
    }

    function iniciarGiroLento() {
        if (aroRuleta.classList.contains("is-idle")) return;
        aroRuleta.style.setProperty("--wheel-start-angle", anguloActualRueda() + "deg");
        aroRuleta.classList.add("is-idle");
    }

    function actualizarCuentaAtras() {
        let segundos = Math.max(0, Math.ceil((finCuentaAtras - Date.now()) / 1000));
        cuentaAtras.textContent = "Quedan " + segundos + " s para girar la ruleta.";
        if (segundos === 0) {
            window.clearInterval(temporizadorApuesta);
            temporizadorApuesta = null;
            girarRuleta();
        }
    }

    function iniciarCuentaAtras() {
        if (temporizadorApuesta !== null || girando || apuestasPendientes.length === 0) return;
        iniciarGiroLento();
        finCuentaAtras = Date.now() + 45000;
        actualizarCuentaAtras();
        temporizadorApuesta = window.setInterval(actualizarCuentaAtras, 1000);
    }

    function cancelarCuentaAtras() {
        if (temporizadorApuesta !== null) {
            window.clearInterval(temporizadorApuesta);
            temporizadorApuesta = null;
        }
        cuentaAtras.textContent = "Añade una apuesta para iniciar el conteo de 45 segundos.";
    }

    opciones.forEach(function(opcion) {
        opcion.addEventListener("click", function() {
            tipoApuesta = opcion.dataset.betType;
            actualizarSeleccion();
            if (importeRapido !== null) agregarApuesta(importeRapido);
        });
    });

    fichasRapidas.forEach(function(ficha) {
        ficha.addEventListener("click", function() {
            importeRapido = Number(ficha.dataset.amount);
            apuestaInput.value = String(importeRapido);
            fichasRapidas.forEach(function(otraFicha) {
                otraFicha.setAttribute("aria-pressed", String(otraFicha === ficha));
            });
            mostrarMensaje("Importe rápido seleccionado: " +
                importeRapido.toLocaleString("es-CL") + " puntos. Toca una casilla para apostar.", "");
        });
    });

    botonApuestaMaxima.addEventListener("click", function() {
        let cuenta = obtenerCuentaSesion();
        if (!cuenta) {
            mostrarMensaje("Inicia sesión para apostar tus puntos en la ruleta.", "loss");
            return;
        }
        desactivarApuestaRapida();
        apuestaInput.value = String(Math.max(0, puntosCuenta(cuenta) - totalApostado()));
        apuestaInput.focus();
    });

    apuestaInput.addEventListener("input", desactivarApuestaRapida);

    botonAgregarApuesta.addEventListener("click", function() {
        agregarApuesta(Number(apuestaInput.value));
    });

    botonLimpiarApuestas.addEventListener("click", function() {
        apuestasPendientes = [];
        actualizarApuestas();
        mostrarMensaje("Se vaciaron las apuestas preparadas.", "");
        cancelarCuentaAtras();
    });

    botonDeshacerApuesta.addEventListener("click", function() {
        if (girando || apuestasPendientes.length === 0) return;
        let apuestaQuitada = apuestasPendientes.pop();
        actualizarApuestas();
        mostrarMensaje("Se quitó la apuesta a " + descripcionApuesta(apuestaQuitada) + ".", "");
    });

    function reproducirSonidoGiro(duracion) {
        let ConstructorAudio = window.AudioContext || window.webkitAudioContext;
        if (!ConstructorAudio) return;
        try {
            audioContext = audioContext || new ConstructorAudio();
            if (audioContext.state === "suspended") audioContext.resume();
        } catch (error) {
            return;
        }

        sonidoActivo = true;
        let inicio = Date.now();
        function emitirTick() {
            if (!sonidoActivo) return;
            let ahora = audioContext.currentTime;
            let oscilador = audioContext.createOscillator();
            let volumen = audioContext.createGain();
            oscilador.type = "square";
            oscilador.frequency.setValueAtTime(880, ahora);
            volumen.gain.setValueAtTime(0.045, ahora);
            volumen.gain.exponentialRampToValueAtTime(0.001, ahora + 0.035);
            oscilador.connect(volumen);
            volumen.connect(audioContext.destination);
            oscilador.start(ahora);
            oscilador.stop(ahora + 0.04);

            let transcurrido = Date.now() - inicio;
            if (transcurrido < duracion) window.setTimeout(emitirTick, 45 + transcurrido / 24);
            else sonidoActivo = false;
        }
        emitirTick();
    }

    function girarRuleta() {
        if (girando) return;
        let cuenta = obtenerCuentaSesion();
        if (!cuenta) {
            mostrarMensaje("Inicia sesión para apostar tus puntos en la ruleta.", "loss");
            apuestasPendientes = [];
            actualizarApuestas();
            actualizarSaldo();
            cancelarCuentaAtras();
            return;
        }

        if (apuestasPendientes.length === 0) {
            cancelarCuentaAtras();
            return;
        }
        let apuestasDelGiro = apuestasPendientes.slice();
        let cantidadApuesta = totalApostado();
        if (cantidadApuesta > puntosCuenta(cuenta)) {
            mostrarMensaje("Saldo insuficiente. Tienes " +
                puntosCuenta(cuenta).toLocaleString("es-CL") + " puntos.", "loss");
            apuestasPendientes = [];
            actualizarApuestas();
            actualizarSaldo();
            cancelarCuentaAtras();
            return;
        }
        let premioMaximo = 0;
        let premioNoValido = apuestasDelGiro.some(function(apuesta) {
            let multiplicador = multiplicadorApuesta(apuesta.tipo);
            if (apuesta.importe > Math.floor(Number.MAX_SAFE_INTEGER / multiplicador)) return true;
            premioMaximo += apuesta.importe * multiplicador;
            return !Number.isSafeInteger(premioMaximo);
        });
        if (premioNoValido || premioMaximo > Number.MAX_SAFE_INTEGER - puntosCuenta(cuenta) + cantidadApuesta) {
            mostrarMensaje("El premio potencial supera el límite de puntos permitido.", "loss");
            apuestasPendientes = [];
            actualizarApuestas();
            cancelarCuentaAtras();
            return;
        }
        let gradosPorCasilla = 360 / ordenRuleta.length;
        let resultado = Math.floor(Math.random() * ordenRuleta.length);
        let anguloCentroResultado = resultado * gradosPorCasilla + gradosPorCasilla / 2;
        let anguloInicioPelota = Math.floor(Math.random() * 360);
        let vueltasBola = 2 + Math.floor(Math.random() * 4);
        let duracionGiroPelota = 6500 + vueltasBola * 700 + Math.floor(Math.random() * 1300);
        let anguloFinalPelota = -vueltasBola * 360;
        let giroGuardado = {
            numero: ordenRuleta[resultado],
            apuestas: apuestasDelGiro,
            cantidadApuesta
        };
        if (!guardarGiroRuleta(giroGuardado)) {
            mostrarMensaje("No se pudo guardar el giro. La apuesta sigue preparada y no se descontó saldo.", "loss");
            return;
        }
        if (!borrarApuestasPendientesGuardadas()) {
            borrarGiroRuleta();
            mostrarMensaje("No se pudo asegurar el giro. La apuesta sigue preparada y no se descontó saldo.", "loss");
            return;
        }
        if (cambiarPuntosSesion(-cantidadApuesta) === null) {
            mostrarMensaje("No se pudo registrar la apuesta. Vuelve a iniciar sesión.", "loss");
            borrarGiroRuleta();
            guardarApuestasPendientes();
            actualizarApuestas();
            actualizarSaldo();
            cancelarCuentaAtras();
            return;
        }

        girando = true;
        cambiarEstadoControles(true);
        resultadoElemento.textContent = "?";
        pistaPelota.classList.remove("is-revealed", "is-spinning", "is-landed");
        pistaPelota.style.setProperty("--ball-start-angle", anguloInicioPelota + "deg");
        pistaPelota.style.setProperty("--ball-end-angle", anguloFinalPelota + "deg");
        pistaPelota.style.setProperty("--ball-duration", duracionGiroPelota + "ms");
        pistaPelota.style.transform = "rotate(" + anguloInicioPelota + "deg)";
        void rueda.offsetWidth;
        pistaPelota.classList.add("is-revealed", "is-spinning");
        reproducirSonidoGiro(duracionGiroPelota);
        mensaje.classList.remove("is-win", "is-loss");
        mensaje.textContent = "La bola está girando. La ruleta sigue girando lentamente.";
        cuentaAtras.textContent = "Apuestas cerradas. La bola está girando...";

        window.setTimeout(function() {
            sonidoActivo = false;
            finalizarGiroRuleta(giroGuardado, false);
        }, duracionGiroPelota + 150);
    }

    actualizarSeleccion();
    actualizarSaldo();
    let giroRecuperado = leerGiroRuleta();
    if (giroRecuperado) {
        apuestasPendientes = [];
        finalizarGiroRuleta(giroRecuperado, true);
    } else {
        restaurarApuestasPendientes();
        actualizarApuestas();
        if (apuestasPendientes.length) {
            mostrarMensaje("Se restauraron tus apuestas preparadas.", "");
            iniciarCuentaAtras();
        }
    }
}

document.querySelector(".register-form")?.addEventListener("submit", function(evento) {
    evento.preventDefault();

    let email = document.getElementById("email").value.trim().toLowerCase();
    let username = document.getElementById("register-username").value.trim();
    let password = document.getElementById("register-password").value;
    let displayName = document.getElementById("display-name").value.trim();
    let cuentas = obtenerCuentas();

    if (cuentas.some(function(cuenta) {
        return normalizarIdentificador(cuenta.email) === email ||
            normalizarIdentificador(cuenta.username) === normalizarIdentificador(username);
    })) {
        alert("Ese correo o usuario ya está registrado.");
        return;
    }

    cuentas.push({
        email,
        username,
        password,
        displayName,
        puntos: 0,
        bonoInicioSesionOtorgado: false
    });
    guardarCuentas(cuentas);
    alert("Cuenta creada. Ya puedes iniciar sesión.");
    window.location.href = "login.html";
});

document.querySelectorAll(".password-toggle").forEach(function(boton) {
    boton.addEventListener("click", function() {
        let campo = document.getElementById(boton.getAttribute("aria-controls"));
        if (!campo) return;

        let mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        boton.textContent = mostrar ? "Ocultar" : "Mostrar";
        boton.setAttribute("aria-pressed", String(mostrar));
    });
});

document.querySelector(".login-form")?.addEventListener("submit", function(evento) {
    evento.preventDefault();

    let identificador = document.getElementById("username").value.trim().toLowerCase();
    let password = document.getElementById("password").value;
    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(usuario) {
        let correo = normalizarIdentificador(usuario.email);
        let username = normalizarIdentificador(usuario.username);
        return (identificador === correo || identificador === username) &&
            typeof usuario.password === "string" && password === usuario.password;
    });

    if (!cuenta) {
        alert("Usuario, correo o contraseña incorrectos. Revisa tus datos o regístrate.");
        return;
    }

    let saldo = puntosCuenta(cuenta);
    let bonoAplicado = cuenta.bonoInicioSesionOtorgado !== true;
    if (bonoAplicado) {
        if (saldo > Number.MAX_SAFE_INTEGER - 3000) {
            alert("No se pudo aplicar el bono de inicio de sesión porque el saldo superaría el límite permitido.");
            return;
        }
        cuenta.puntos = saldo + 3000;
        cuenta.bonoInicioSesionOtorgado = true;
        guardarCuentas(cuentas);
        saldo = cuenta.puntos;
    }

    sessionStorage.setItem("chichacookSession", cuenta.username);
    alert(bonoAplicado
        ? "¡Bienvenido/a, " + cuenta.displayName +
            "! Recibiste tu bono único de 3.000 puntos. Tu saldo es de " +
            saldo.toLocaleString("es-CL") + " puntos."
        : "¡Bienvenido/a, " + cuenta.displayName + "! Tu saldo es de " +
            saldo.toLocaleString("es-CL") + " puntos.");
    let continuarCompra = sessionStorage.getItem("chichacookContinueAfterLogin");
    if (continuarCompra === "services-cart") {
        sessionStorage.removeItem("chichacookContinueAfterLogin");
        window.location.href = "servicios.html?abrirCarrito=1";
    } else if (continuarCompra === "services-add-product") {
        sessionStorage.removeItem("chichacookContinueAfterLogin");
        window.location.href = "servicios.html?abrirCarrito=1&agregarPendiente=1";
    } else {
        window.location.href = "index.html";
    }
});

let recoveryDialog = document.getElementById("password-recovery-dialog");
let recoveryForm = document.getElementById("password-recovery-form");

document.getElementById("open-password-recovery")?.addEventListener("click", function() {
    document.getElementById("recovery-message").textContent = "";
    recoveryDialog.showModal();
});

document.getElementById("close-password-recovery")?.addEventListener("click", function() {
    recoveryDialog.close();
});

recoveryForm?.addEventListener("submit", function(evento) {
    evento.preventDefault();

    let email = document.getElementById("recovery-email").value.trim().toLowerCase();
    let password = document.getElementById("recovery-password").value;
    let passwordConfirm = document.getElementById("recovery-password-confirm").value;
    let mensaje = document.getElementById("recovery-message");

    if (password !== passwordConfirm) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(usuario) {
        return usuario.email && usuario.email.toLowerCase() === email;
    });

    if (!cuenta) {
        mensaje.textContent = "No encontramos una cuenta con ese correo.";
        return;
    }

    cuenta.password = password;
    guardarCuentas(cuentas);
    recoveryForm.reset();
    mensaje.textContent = "Contraseña actualizada. Ya puedes iniciar sesión.";
});

document.getElementById("redeem-reward")?.addEventListener("click", function(evento) {
    let boton = evento.currentTarget;
    let mensaje = document.getElementById("redeem-message");
    let usuarioSesion = sessionStorage.getItem("chichacookSession");
    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(usuario) {
        return normalizarIdentificador(usuario.username) === normalizarIdentificador(usuarioSesion);
    });
    if (!cuenta) {
        mensaje.textContent = "Inicia sesión para consultar tus puntos y canjear la recompensa.";
        mensaje.classList.add("is-redeem-error");
        return;
    }
    if (cuenta.recompensaChichaCanjeada) {
        mensaje.textContent = "Ya canjeaste esta recompensa. Solo se permite un canje por cuenta.";
        mensaje.classList.remove("is-redeem-error");
        boton.disabled = true;
        boton.textContent = "Ya canjeada";
        return;
    }
    if (puntosCuenta(cuenta) < 15000) {
        mensaje.textContent = "Necesitas 15.000 puntos para canjear la chicha. Tu saldo es " +
            puntosCuenta(cuenta).toLocaleString("es-CL") + " puntos.";
        mensaje.classList.add("is-redeem-error");
        return;
    }
    cuenta.puntos = puntosCuenta(cuenta) - 15000;
    cuenta.recompensaChichaCanjeada = true;
    guardarCuentas(cuentas);

    mensaje.classList.remove("is-redeem-error");
    boton.disabled = true;
    boton.textContent = "Ya canjeada";
    mensaje.textContent = "¡Canje realizado! Disfruta tu chicha. Esta recompensa ya quedó registrada en tu cuenta.";
    let estadoRecompensa = document.getElementById("reward-status");
    if (estadoRecompensa) {
        estadoRecompensa.textContent = "Recompensa canjeada";
        estadoRecompensa.classList.add("is-redeemed");
    }
    actualizarNavegacionSesion();
    let puntosRecompensaActuales = document.getElementById("reward-points");
    if (puntosRecompensaActuales) {
        puntosRecompensaActuales.textContent = cuenta.puntos.toLocaleString("es-CL");
    }
});

document.getElementById("redeem-topping-reward")?.addEventListener("click", function(evento) {
    let boton = evento.currentTarget;
    let mensaje = document.getElementById("topping-redeem-message");
    let estado = document.getElementById("topping-reward-status");
    let usuarioSesion = sessionStorage.getItem("chichacookSession");
    let cuentas = obtenerCuentas();
    let cuenta = cuentas.find(function(usuario) {
        return normalizarIdentificador(usuario.username) === normalizarIdentificador(usuarioSesion);
    });

    if (!cuenta) {
        mensaje.textContent = "Inicia sesión para canjear esta recompensa.";
        mensaje.classList.add("is-redeem-error");
        return;
    }
    if (cuenta.recompensaToppingCanjeada) {
        boton.disabled = true;
        boton.textContent = "Ya canjeada";
        mensaje.textContent = "Esta recompensa solo se puede canjear una vez por cuenta.";
        mensaje.classList.remove("is-redeem-error");
        return;
    }
    if (puntosCuenta(cuenta) < 10000) {
        mensaje.textContent = "Necesitas 10.000 puntos. Tu saldo es " +
            puntosCuenta(cuenta).toLocaleString("es-CL") + " puntos.";
        mensaje.classList.add("is-redeem-error");
        return;
    }

    cuenta.puntos = puntosCuenta(cuenta) - 10000;
    cuenta.recompensaToppingCanjeada = true;
    cuenta.toppingGratisDisponible = true;
    guardarCuentas(cuentas);
    boton.disabled = true;
    boton.textContent = "Ya canjeada";
    mensaje.classList.remove("is-redeem-error");
    mensaje.textContent = "Canje realizado. El topping extra gratis estará disponible en tu próxima compra con extra.";
    if (estado) estado.textContent = "Canjeada: topping extra disponible";
    document.querySelectorAll("#reward-points, #topping-reward-points").forEach(function(elemento) {
        elemento.textContent = cuenta.puntos.toLocaleString("es-CL");
    });
    actualizarNavegacionSesion();
});

iniciarBlackjack();
iniciarRuleta();
actualizarNavegacionSesion();
actualizarCantidad();
let parametrosServicios = new URLSearchParams(window.location.search);
if (document.querySelector(".pedido") && parametrosServicios.get("agregarPendiente") === "1" && obtenerCuentaSesion()) {
    let productoPendiente;
    try {
        productoPendiente = JSON.parse(sessionStorage.getItem("chichacookPendingProduct") || "null");
    } catch (error) {
        productoPendiente = null;
    }
    sessionStorage.removeItem("chichacookPendingProduct");
    let opcionesToppingValidas = ["Ninguno", "Oreo", "M&M", "Chispas de chocolate"];
    if (productoPendiente && opcionesToppingValidas.includes(productoPendiente.topping1) &&
        opcionesToppingValidas.includes(productoPendiente.topping2) &&
        opcionesToppingValidas.includes(productoPendiente.extra)) {
        carrito.push({
            nombre: "Chicha venezolana",
            toppings: productoPendiente.topping1 + ", " + productoPendiente.topping2,
            extra: productoPendiente.extra,
            precio: productoPendiente.extra === "Ninguno" ? 1200 : 1400
        });
        guardarCarrito();
        actualizarCantidad();
    }
}
if (document.querySelector(".pedido") && parametrosServicios.get("abrirCarrito") === "1") {
    mostrarCarrito();
}
let puntosRecompensa = document.getElementById("reward-points");
let puntosToppingRecompensa = document.getElementById("topping-reward-points");
if (puntosRecompensa || puntosToppingRecompensa) {
    let cuenta = obtenerCuentaSesion();
    let saldoRecompensas = cuenta ? puntosCuenta(cuenta).toLocaleString("es-CL") : "Inicia sesión";
    if (puntosRecompensa) puntosRecompensa.textContent = saldoRecompensas;
    if (puntosToppingRecompensa) puntosToppingRecompensa.textContent = saldoRecompensas;
    let botonRecompensa = document.getElementById("redeem-reward");
    let estadoRecompensa = document.getElementById("reward-status");
    let mensajeRecompensa = document.getElementById("redeem-message");
    if (cuenta && cuenta.recompensaChichaCanjeada) {
        if (botonRecompensa) {
            botonRecompensa.disabled = true;
            botonRecompensa.textContent = "Ya canjeada";
        }
        if (estadoRecompensa) {
            estadoRecompensa.textContent = "Recompensa canjeada";
            estadoRecompensa.classList.add("is-redeemed");
        }
        if (mensajeRecompensa) {
            mensajeRecompensa.textContent = "Esta recompensa ya fue canjeada en tu cuenta.";
        }
    } else if (cuenta && estadoRecompensa) {
        estadoRecompensa.textContent = "Disponible para canjear";
    }

    let botonToppingRecompensa = document.getElementById("redeem-topping-reward");
    let estadoToppingRecompensa = document.getElementById("topping-reward-status");
    let mensajeToppingRecompensa = document.getElementById("topping-redeem-message");
    if (cuenta && cuenta.recompensaToppingCanjeada) {
        if (botonToppingRecompensa) {
            botonToppingRecompensa.disabled = true;
            botonToppingRecompensa.textContent = "Ya canjeada";
        }
        if (estadoToppingRecompensa) {
            estadoToppingRecompensa.textContent = cuenta.toppingGratisDisponible
                ? "Canjeada: topping extra disponible"
                : "Recompensa ya utilizada";
            if (!cuenta.toppingGratisDisponible) estadoToppingRecompensa.classList.add("is-redeemed");
        }
        if (mensajeToppingRecompensa) {
            mensajeToppingRecompensa.textContent = cuenta.toppingGratisDisponible
                ? "El topping extra gratis se aplicará a una chicha con extra en tu próxima compra."
                : "Esta recompensa ya fue utilizada en una compra.";
        }
    } else if (cuenta && estadoToppingRecompensa) {
        estadoToppingRecompensa.textContent = "Disponible para canjear";
    }
}