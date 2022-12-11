import React from "react";

const Modal = ({ children, closeModal, saveModal, modalState, title, addServer, deleteServer}) => {
  if (!modalState) {
    return null;
  }

  return (
    <div className="modal is-active">
      <div className="modal-background"
      //  onClick={closeModal}
        />
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" onClick={closeModal} />
        </header>
        <section className="modal-card-body">
          <div className="content" id="content">
            {children}
          </div>
        </section>
        <footer className="modal-card-foot">
          <div className="">
          <a className="button is-primary is-light" onClick={addServer}>Add New</a>
          <a className="button is-danger is-light" onClick={deleteServer}>Delete Selected</a>
          </div>
          {/* spacer div */}
          <div className="is-flex-grow-1"></div>
          <div className="">
          <a className="button is-danger" onClick={closeModal}>Cancel</a>
          <a className="button is-success" onClick={saveModal}>Save Settings</a> 
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Modal;