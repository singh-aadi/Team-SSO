import React from 'react';

export function CommunicationAnalysis() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Communication Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Email Analytics</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Founder Updates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Frequency</p>
                  <p className="font-medium">Monthly</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Consistency</p>
                  <p className="font-medium text-green-600">High</p>
                </div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Response Time</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Average</p>
                  <p className="font-medium">4 hours</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Rating</p>
                  <p className="font-medium text-green-600">Excellent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Content Analysis</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {['Growth', 'Product Updates', 'Team', 'Fundraising', 'Metrics'].map((topic) => (
                  <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Sentiment Analysis</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      Positive
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      85%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
