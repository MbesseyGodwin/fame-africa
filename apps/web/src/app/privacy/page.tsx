import React from 'react';

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 21, 2026";
  const entityName = "Consolidated Software Solutions";
  const appName = "FameAfrica";
  const contactEmail = "mbesseygodwin@gmail.com";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-2xl p-8 sm:p-12 border border-gray-100">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 italic">Last Updated: {lastUpdated}</p>

        <section className="space-y-6">
          <p>
            Welcome to <strong>{appName}</strong>. We value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how <strong>{entityName}</strong> ("we," "us," or "our") collects, uses, 
            discloses, and safeguards your information when you use our mobile application and our website.
          </p>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">1. Information We Collect</h2>
          <div className="pl-4 border-l-4 border-rose-500 space-y-4">
            <div>
              <h3 className="font-semibold underline">Personal Data</h3>
              <p>
                While using our service, we may ask you to provide us with certain personally identifiable information that 
                can be used to contact or identify you ("Personal Data"). This includes:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Profile photograph (for contestants)</li>
                <li>Location data (State/City for competition eligibility)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold underline">Usage Data</h3>
              <p>Data collected automatically may include your device's IP address, browser type, browser version, the pages of our service that you visit, and other diagnostic data.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">2. Use of Your Personal Data</h2>
          <p>The Company may use Personal Data for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>To provide and maintain our Service:</strong> Including to monitor the usage of our Service.</li>
            <li><strong>To manage your Account:</strong> To manage your registration as a user of the Service.</li>
            <li><strong>For the performance of a contract:</strong> The development, compliance and undertaking of the competition rules.</li>
            <li><strong>To contact you:</strong> To reach you by email, telephone calls, or SMS regarding updates and informative communications.</li>
            <li><strong>To process payments:</strong> Securely handle voting transactions via our payment partners.</li>
          </ul>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">3. Third-Party Services</h2>
          <p>We use trusted third-party providers to enhance our service:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Agora:</strong> Used for real-time video streaming services.</li>
            <li><strong>Paystack:</strong> Used as our payment gateway for secure transaction processing.</li>
            <li><strong>Cloudinary:</strong> Used for storing and serving user-uploaded media like profile images.</li>
          </ul>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">4. Data Retention and Deletion</h2>
          <p>
            The Company will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. 
            You have the right to request the deletion of your data at any time by contacting us or using the in-app account deletion feature.
          </p>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">5. Security of Your Personal Data</h2>
          <p>
            The security of your Personal Data is important to us, but remember that no method of transmission over the Internet, 
            or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, 
            we cannot guarantee its absolute security.
          </p>

          <h2 className="text-2xl font-bold border-b pb-2 pt-4">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, you can contact us:</p>
          <ul className="list-disc pl-5">
            <li>By email: <a href={`mailto:${contactEmail}`} className="text-rose-600 hover:underline">{contactEmail}</a></li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} {entityName}. All rights reserved.
        </div>
      </div>
    </div>
  );
}
