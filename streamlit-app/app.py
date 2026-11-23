
import streamlit as st
import requests

API_URL = "http://localhost:3000/api"

st.set_page_config(
    page_title="SmartCampus AI",
    page_icon="🎓",
    layout="wide"
)

# -------------------------
# SESSION STATE
# -------------------------

if "token" not in st.session_state:
    st.session_state.token = None

if "user" not in st.session_state:
    st.session_state.user = None

if "visitor_token" not in st.session_state:
    st.session_state.visitor_token = None

if "active_conversation_id" not in st.session_state:
    st.session_state.active_conversation_id = None


# -------------------------
# API HELPER FUNCTIONS
# -------------------------

def get_headers():
    return {
        "Authorization": f"Bearer {st.session_state.token}"
    }


def get_conversations():
    response = requests.get(
        f"{API_URL}/conversations",
        headers=get_headers(),
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def create_conversation():
    response = requests.post(
        f"{API_URL}/conversations",
        headers=get_headers(),
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def get_conversation(conversation_id):
    response = requests.get(
        f"{API_URL}/conversations/{conversation_id}",
        headers=get_headers(),
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def send_message(conversation_id, message):
    response = requests.post(
        f"{API_URL}/conversations/{conversation_id}/messages",
        headers=get_headers(),
        json={"contenu": message},
        timeout=180
    )
    response.raise_for_status()
    return response.json()


# -------------------------
# APPLICATION
# -------------------------

st.title("🎓 SmartCampus AI")
st.caption("Your university orientation assistant")


# -------------------------
# LOGIN / REGISTER
# -------------------------

if not st.session_state.token:

    login_tab, register_tab = st.tabs(["Login", "Register"])

    with login_tab:
        st.subheader("Login")

        email = st.text_input("Email", key="login_email")
        password = st.text_input(
            "Password",
            type="password",
            key="login_password"
        )

        if st.button("Login", use_container_width=True):
            try:
                headers = {}

                if st.session_state.visitor_token:
                    headers["x-visitor-token"] = st.session_state.visitor_token

                response = requests.post(
                    f"{API_URL}/auth/login",
                    json={
                        "email": email,
                        "password": password
                    },
                    headers=headers,
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()

                    st.session_state.token = data.get("access_token")
                    st.session_state.user = data

                    if st.session_state.token:
                        st.success("Login successful!")
                        st.rerun()
                    else:
                        st.error("Access token not found in response.")
                else:
                    st.error(response.text)

            except requests.RequestException as e:
                st.error(f"Connection error: {e}")

    with register_tab:
        st.subheader("Create a candidate account")

        nom = st.text_input("Last name", key="register_nom")
        prenom = st.text_input("First name", key="register_prenom")
        email = st.text_input("Email", key="register_email")
        telephone = st.text_input("Phone (optional)", key="register_phone")

        password = st.text_input(
            "Password",
            type="password",
            key="register_password"
        )

        if st.button("Register", use_container_width=True):
            try:
                payload = {
                    "nom": nom,
                    "prenom": prenom,
                    "email": email,
                    "password": password
                }

                if telephone.strip():
                    payload["telephone"] = telephone.strip()

                response = requests.post(
                    f"{API_URL}/auth/register/candidat",
                    json=payload,
                    timeout=30
                )

                if response.status_code in (200, 201):
                    st.success("Account created! You can now log in.")
                else:
                    st.error(response.text)

            except requests.RequestException as e:
                st.error(f"Connection error: {e}")


# -------------------------
# AUTHENTICATED CHAT
# -------------------------

else:

    st.sidebar.title("🎓 SmartCampus AI")

    # New conversation
    if st.sidebar.button("➕ New conversation", use_container_width=True):
        try:
            new_conversation = create_conversation()

            st.session_state.active_conversation_id = new_conversation["id"]

            st.rerun()

        except requests.RequestException as e:
            st.sidebar.error(f"Could not create conversation: {e}")

    st.sidebar.divider()
    st.sidebar.subheader("Conversation history")

    selected_id = None

    try:
        conversations = get_conversations()

        if conversations:
            conversation_ids = [c["id"] for c in conversations]

            active_id = st.session_state.active_conversation_id

            if active_id not in conversation_ids:
                active_id = conversation_ids[0]

            selected_id = st.sidebar.selectbox(
                "Your conversations",
                options=conversation_ids,
                index=conversation_ids.index(active_id),
                format_func=lambda cid: next(
                    (
                        c["titre"] or f"Conversation {cid}"
                        for c in conversations
                        if c["id"] == cid
                    ),
                    f"Conversation {cid}"
                )
            )

            st.session_state.active_conversation_id = selected_id

        else:
            st.session_state.active_conversation_id = None
            st.sidebar.info("No conversations yet. Create one!")

    except requests.RequestException as e:
        st.sidebar.error(f"Could not load conversations: {e}")

    # Main chat
    st.title("💬 SmartCampus AI")

    if selected_id is not None:

        try:
            conversation = get_conversation(selected_id)

            messages = conversation.get("messages", [])

            for message in messages:
                role = message["role"].lower()

                if role in ("user", "assistant"):
                    with st.chat_message(role):
                        st.markdown(message["contenu"])

            prompt = st.chat_input("Ask SmartCampus AI...")

            if prompt:
                try:
                    result = send_message(selected_id, prompt)

                    assistant_message = result.get("assistantMessage", {})
                    answer = assistant_message.get(
                        "contenu",
                        "No response received."
                    )

                    st.rerun()

                except requests.RequestException as e:
                    st.error(f"AI request failed: {e}")

        except requests.RequestException as e:
            st.error(f"Could not load this conversation: {e}")

    else:
        st.info("Create a new conversation to start chatting!")

    # Logout
    st.sidebar.divider()

    if st.sidebar.button("Logout"):
        st.session_state.token = None
        st.session_state.user = None
        st.session_state.active_conversation_id = None
        st.rerun()
