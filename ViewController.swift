import Cocoa

class ViewController: NSViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        // Create the text field
        let textField = NSTextField()
        textField.stringValue = "Loading USB devices..."
        textField.isEditable = false
        textField.isBordered = false
        textField.backgroundColor = NSColor.clear
        textField.textColor = NSColor.labelColor
        textField.font = NSFont.systemFont(ofSize: 16)
        textField.alignment = .center
        
        // Add text field to view
        view.addSubview(textField)
        
        // Configure constraints for centering
        textField.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            textField.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            textField.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            textField.widthAnchor.constraint(lessThanOrEqualTo: view.widthAnchor, constant: -40),
            textField.heightAnchor.constraint(equalToConstant: 30)
        ])
    }
} 