--
-- PostgreSQL database dump
--

\restrict nLEbsonHUn8zyQAVfpp2Nws9arc6ZGnwNLS17nCmhK8SAaGsgMZyWhjjf4osl3A

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-28 00:38:52

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16504)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 16489)
-- Name: attestations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attestations (
    id integer NOT NULL,
    code_unique character varying(50) NOT NULL,
    nom_etudiant character varying(100) NOT NULL,
    formation character varying(100) NOT NULL,
    est_valide boolean DEFAULT true,
    date_emission date DEFAULT CURRENT_DATE
);


ALTER TABLE public.attestations OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16488)
-- Name: attestations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attestations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attestations_id_seq OWNER TO postgres;

--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 226
-- Name: attestations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attestations_id_seq OWNED BY public.attestations.id;


--
-- TOC entry 221 (class 1259 OID 16432)
-- Name: inscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inscriptions (
    id character varying(8) DEFAULT upper(SUBSTRING(md5((random())::text) FROM 1 FOR 6)) NOT NULL,
    nom_complet character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(50) NOT NULL,
    formation character varying(255) NOT NULL,
    date_inscription timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    statut character varying(20) DEFAULT 'nouveau'::character varying,
    statut_scolaire character varying(50) DEFAULT 'En cours'::character varying
);


ALTER TABLE public.inscriptions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16431)
-- Name: inscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inscriptions_id_seq OWNER TO postgres;

--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 220
-- Name: inscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inscriptions_id_seq OWNED BY public.inscriptions.id;


--
-- TOC entry 223 (class 1259 OID 16460)
-- Name: messages_contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages_contact (
    id character varying(8) DEFAULT upper(SUBSTRING(md5((random())::text) FROM 1 FOR 7)) NOT NULL,
    nom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    message text NOT NULL,
    date_envoi timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    statut character varying(20) DEFAULT 'nouveau'::character varying
);


ALTER TABLE public.messages_contact OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16459)
-- Name: messages_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_contact_id_seq OWNER TO postgres;

--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 222
-- Name: messages_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_contact_id_seq OWNED BY public.messages_contact.id;


--
-- TOC entry 225 (class 1259 OID 16476)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16475)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 224
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4918 (class 2604 OID 16492)
-- Name: attestations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations ALTER COLUMN id SET DEFAULT nextval('public.attestations_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 16479)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4932 (class 2606 OID 16502)
-- Name: attestations attestations_code_unique_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_code_unique_key UNIQUE (code_unique);


--
-- TOC entry 4934 (class 2606 OID 16500)
-- Name: attestations attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_pkey PRIMARY KEY (id);


--
-- TOC entry 4922 (class 2606 OID 16561)
-- Name: inscriptions inscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 16571)
-- Name: messages_contact messages_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages_contact
    ADD CONSTRAINT messages_contact_pkey PRIMARY KEY (id);


--
-- TOC entry 4924 (class 2606 OID 24668)
-- Name: inscriptions unique_telephone_formation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT unique_telephone_formation UNIQUE (telephone, formation);


--
-- TOC entry 4928 (class 2606 OID 16485)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4930 (class 2606 OID 16487)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


-- Completed on 2026-05-28 00:38:52

--
-- PostgreSQL database dump complete
--

\unrestrict nLEbsonHUn8zyQAVfpp2Nws9arc6ZGnwNLS17nCmhK8SAaGsgMZyWhjjf4osl3A

