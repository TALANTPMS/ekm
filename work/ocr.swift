import AppKit
import Vision

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: ocr image\n", stderr)
    exit(1)
}

let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard
    let image = NSImage(contentsOf: imageURL),
    let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
    fputs("Cannot read image\n", stderr)
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.recognitionLanguages = ["en-US"]
request.minimumTextHeight = 0.006

let handler = VNImageRequestHandler(cgImage: cgImage)
try handler.perform([request])

let observations = (request.results ?? []).sorted {
    let firstY = $0.boundingBox.midY
    let secondY = $1.boundingBox.midY
    if abs(firstY - secondY) > 0.01 {
        return firstY > secondY
    }
    return $0.boundingBox.minX < $1.boundingBox.minX
}

for observation in observations {
    guard let candidate = observation.topCandidates(1).first else { continue }
    let box = observation.boundingBox
    print(String(format: "%.4f %.4f %.4f %.4f | %@",
                 box.minX, box.minY, box.width, box.height, candidate.string))
}
